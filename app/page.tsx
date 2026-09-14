import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Monitor } from "@/components/monitor";
import { EmptyState, ErrorState } from "@/components/states";
import { VersionConsole } from "@/components/version-console";
import { selectableVersions } from "@/features/frontend-version/client";
import { frontendVersionKeys } from "@/features/frontend-version/keys";
import { getFrontendVersion } from "@/features/frontend-version/server";
import type { FrontendVersionList } from "@/features/frontend-version/client";
import { getQueryClient } from "@/lib/query-client";

export default async function Home() {
  const queryClient = getQueryClient();

  let data: FrontendVersionList;
  try {
    // fetchQuery (not prefetchQuery) so a failure here still throws and
    // hits the catch below — prefetchQuery swallows errors, which would
    // silently render an empty console instead of ErrorState.
    data = await queryClient.fetchQuery({
      queryKey: frontendVersionKeys.all,
      queryFn: getFrontendVersion,
    });
  } catch {
    return (
      <main className="flex min-h-dvh items-center justify-center p-[14px]">
        <Monitor title="FRONTEND VERSION SELECT" className="w-full max-w-2xl">
          <ErrorState />
        </Monitor>
      </main>
    );
  }

  const versions = selectableVersions(data.versions);

  return (
    <main className="flex min-h-dvh items-center justify-center p-[14px]">
      <Monitor title="FRONTEND VERSION SELECT" className="w-full max-w-2xl">
        {versions.length === 0 ? (
          <EmptyState />
        ) : (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <VersionConsole />
          </HydrationBoundary>
        )}
      </Monitor>
    </main>
  );
}
