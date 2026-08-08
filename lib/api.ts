import type { FrontendVersion, FrontendVersionList } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const FRONTEND_VERSION_KEY =
  process.env.NEXT_PUBLIC_FRONTEND_VERSION_KEY ?? "port-landing";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`LINK FAILURE // ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Server-side read: revalidates on a 60s window so the page always
 * renders regardless of CORS (RSC fetches aren't subject to it) —
 * unlike a browser-side fetch, which the backend only allows from an
 * origin that already has a FrontendVersion row.
 */
export const getFrontendVersions = () =>
  fetchJson<FrontendVersionList>("/v1/frontend-version", {
    next: { revalidate: 60 },
  });

/**
 * Browser-side read that also counts this visit. Must run client-side
 * only — the header is what the view interceptor keys on, and running
 * it server-side would attribute every visitor to Vercel's shared
 * egress IP under the backend's 2-hour per-IP dedupe window.
 */
export const pingFrontendVersions = () =>
  fetchJson<FrontendVersionList>("/v1/frontend-version", {
    cache: "no-store",
    headers: { "X-Frontend-Version": FRONTEND_VERSION_KEY },
  });

/**
 * Sorted by `order` asc (defensively — the API already sorts, but the
 * auto-lock target depends on this) with this page's own entry (if it
 * has a FrontendVersion row) excluded from the selectable list.
 */
export function selectableVersions(
  versions: FrontendVersion[],
): FrontendVersion[] {
  return versions
    .filter((version) => version.key !== FRONTEND_VERSION_KEY)
    .sort((a, b) => a.order - b.order);
}
