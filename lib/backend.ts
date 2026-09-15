import "server-only";
import { FRONTEND_VERSION_KEY } from "@/features/frontend-version/keys";

// No fallback: the obvious default (localhost:3000) is also Next's own dev
// port, so a missing API_URL would quietly make this app proxy to itself.
const API_URL = process.env.API_URL || missingEnv("API_URL");
const PROXY_SHARED_SECRET = process.env.PROXY_SHARED_SECRET;

// X-Forwarded-For is only as trustworthy as whatever sits in front of this
// server. Vercel overwrites it at its edge and drops client-sent values, so
// it's safe there (VERCEL=1 is set automatically). Served directly — e.g. a
// bare `next start` — Next.js passes a client-sent header straight through,
// so it's ignored and port-server falls back to this server's own IP. Set
// TRUST_FORWARDED_FOR=true only behind another proxy that sets the header.
const TRUST_FORWARDED_FOR =
  process.env.VERCEL === "1" || process.env.TRUST_FORWARDED_FOR === "true";

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

  // The LAST entry, not the first: with a proxy that appends rather than
  // overwrites, anything left of the entry it added is client-controlled.
  // This mirrors port-server's own TRUST_PROXY_HOPS: trust exactly the one
  // real hop between the visitor and this app, counted from the end.
  const visitorIp = TRUST_FORWARDED_FOR
    ? request.headers
        .get("x-forwarded-for")
        ?.split(",")
        .map((ip) => ip.trim())
        .filter(Boolean)
        .at(-1)
    : undefined;
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
    return new Response(res.body, {
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

function missingEnv(name: string): never {
  throw new Error(`${name} is not set — point it at port-server (see .env.example).`);
}
