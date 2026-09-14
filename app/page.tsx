import { Monitor } from "@/components/monitor";
import { EmptyState, ErrorState } from "@/components/states";
import { VersionConsole } from "@/components/version-console";
import { selectableVersions } from "@/lib/api";
import { getFrontendVersions } from "@/lib/backend";
import type { FrontendVersionList } from "@/lib/types";

export default async function Home() {
  let data: FrontendVersionList;
  try {
    data = await getFrontendVersions();
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
          <VersionConsole versions={versions} totalViews={data.totalViews} />
        )}
      </Monitor>
    </main>
  );
}
