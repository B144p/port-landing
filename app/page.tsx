import { Monitor } from "@/components/monitor";
import { EmptyState, ErrorState } from "@/components/states";
import { VersionRow } from "@/components/version-row";
import { getFrontendVersions, selectableVersions } from "@/lib/api";
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
          <>
            <dl className="mb-4 grid grid-cols-[12ch_1fr] gap-x-4 gap-y-1 border-b border-green-dim/40 pb-3">
              <dt className="text-[11px] uppercase tracking-[0.05em] text-text-muted">
                Total Views
              </dt>
              <dd className="text-[13px] tabular-nums text-green-mid">
                {data.totalViews}
              </dd>
            </dl>
            <ul>
              {versions.map((version, index) => (
                <VersionRow
                  key={version.id}
                  version={version}
                  index={index}
                  active={index === 0}
                />
              ))}
            </ul>
          </>
        )}
      </Monitor>
    </main>
  );
}
