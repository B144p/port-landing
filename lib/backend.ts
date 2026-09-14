import "server-only";
import { FRONTEND_VERSION_KEY } from "@/features/frontend-version/keys";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const PROXY_SHARED_SECRET = process.env.PROXY_SHARED_SECRET;

/**
 * Server-side read (RSC fetches aren't subject to CORS). No version header,
 * so it never counts as a page view — see proxyGet for the one that does.
 */
export async function backendGet<T>(
  path: string,
  { revalidate = 60 }: { revalidate?: number } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`LINK FAILURE // ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

/**
 * Used by app/api/*\/route.ts handlers — the only fetches a browser can
 * actually trigger. Forwards enough of the visitor's own request that
 * port-server can attribute the view and rate-limit correctly:
 * X-Visitor-Ip + X-Proxy-Secret let port-server's trusted-proxy middleware
 * substitute the visitor's IP for this server's IP (see port-server's
 * trusted-proxy.middleware.ts) so view-count dedupe and rate limiting stay
 * per-visitor instead of collapsing onto Vercel's shared egress IP.
 */
export async function proxyGet(request: Request, path: string): Promise<Response> {
  const headers: Record<string, string> = {
    "X-Frontend-Version": FRONTEND_VERSION_KEY,
  };

  const visitorIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (visitorIp) headers["X-Visitor-Ip"] = visitorIp;
  if (PROXY_SHARED_SECRET) headers["X-Proxy-Secret"] = PROXY_SHARED_SECRET;

  for (const name of ["user-agent", "accept-language", "referer"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ message: "LINK FAILURE" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
