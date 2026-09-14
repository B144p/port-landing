import type { FrontendVersion, FrontendVersionList } from "@/lib/types";

const FRONTEND_VERSION_KEY =
  process.env.NEXT_PUBLIC_FRONTEND_VERSION_KEY ?? "port-landing";

/**
 * Browser-side read that also counts this visit — via this app's own BFF
 * route (app/api/frontend-version/route.ts), never port-server directly.
 * See lib/backend.ts's proxyGet for how the visitor's IP still reaches
 * port-server's view-count dedupe despite the extra hop.
 */
export async function pingFrontendVersions(): Promise<FrontendVersionList> {
  const res = await fetch("/api/frontend-version", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`LINK FAILURE // ${res.status} /frontend-version`);
  }
  return res.json() as Promise<FrontendVersionList>;
}

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
