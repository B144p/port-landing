import { queryOptions, useQuery } from "@tanstack/react-query";
import { FRONTEND_VERSION_KEY, frontendVersionKeys } from "../keys";
import type { FrontendVersion, FrontendVersionList } from "../types";

export type { FrontendVersion, FrontendVersionList };

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

// Browser-side read that also counts this visit — via this app's own BFF
// route (app/api/frontend-version/route.ts), never port-server directly.
// See lib/backend.ts's proxyGet for how the visitor's IP still reaches
// port-server's view-count dedupe despite the extra hop.
async function fetchFrontendVersion(): Promise<FrontendVersionList> {
  const res = await fetch("/api/frontend-version", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`LINK FAILURE // ${res.status} /frontend-version`);
  }
  const data = (await res.json()) as FrontendVersionList;
  // A network failure or a cold-starting backend must never blank the
  // list, and React Query already keeps the last successful `data` on a
  // failed refetch — so treat a *successful* response with nothing
  // selectable the same way, by failing it here, instead of teaching
  // every consumer to special-case an empty catalog.
  if (selectableVersions(data.versions).length === 0) {
    throw new Error("EMPTY CATALOG // ignoring successful-but-empty response");
  }
  return data;
}

// staleTime: 0 is deliberate: this is also how a visit gets counted.
// Hydrated SSR data is immediately stale, so mount triggers one real
// refetch through /api/frontend-version — carrying the visitor's IP —
// instead of silently reusing the server's view-count-silent prefetch.
// refetchOnWindowFocus/refetchOnReconnect are turned off because staleTime
// 0 means every focus/reconnect would otherwise fire another counted ping
// — "one view per visit" would quietly become "one view per refocus."
export const frontendVersionQuery = queryOptions({
  queryKey: frontendVersionKeys.all,
  queryFn: fetchFrontendVersion,
  staleTime: 0,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});

export function useFrontendVersion() {
  return useQuery(frontendVersionQuery);
}
