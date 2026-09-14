"use client";

import {
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { AutoLock } from "@/components/auto-lock";
import { VersionRow } from "@/components/version-row";
import {
  selectableVersions,
  useFrontendVersion,
  type FrontendVersion,
} from "@/features/frontend-version/client";

/**
 * Owns the channel cursor: arrow keys, Home/End, hover, and native
 * focus all move `selectedIndex` and keep DOM focus in sync with it,
 * so Tab order and the ▶ cursor never disagree about which row is
 * "current". Also tracks hover/focus-within to pause the auto-lock
 * countdown while a visitor is actively interacting with the list.
 */
export function VersionConsole() {
  // The parent page already fetched this successfully and hydrated it in
  // here, so `data` is populated on this very first render — no loading
  // state to handle. staleTime: 0 (see ../features/frontend-version/client)
  // means mount also triggers one real view-counting refetch through the
  // BFF, which is what updates `data` afterwards.
  const { data } = useFrontendVersion();
  const [versions, setVersions] = useState<FrontendVersion[]>(() =>
    data ? selectableVersions(data.versions) : [],
  );
  const [totalViews, setTotalViews] = useState(() => data?.totalViews ?? 0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Adjusting state during render (React's documented pattern for deriving
  // state from a changing prop/query result) instead of an effect: `data`
  // changes when the mount-time refetch through the BFF settles, and this
  // needs to run before that render commits, not after. A network failure
  // or a cold-starting backend must never blank the list — React Query
  // already keeps the last successful `data` on a failed background
  // refetch, so this only guards a *successful* refetch that happens to
  // come back with no selectable versions, matching the previous
  // ping-based implementation's behavior.
  const [lastSeenData, setLastSeenData] = useState(data);
  if (data && data !== lastSeenData) {
    setLastSeenData(data);
    const refreshed = selectableVersions(data.versions);
    if (refreshed.length > 0) {
      setVersions(refreshed);
      setTotalViews(data.totalViews);
    }
  }

  const focusRow = (index: number) => {
    const clamped = Math.max(0, Math.min(versions.length - 1, index));
    setSelectedIndex(clamped);
    rowRefs.current[clamped]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusRow(selectedIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusRow(selectedIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusRow(0);
        break;
      case "End":
        event.preventDefault();
        focusRow(versions.length - 1);
        break;
      default:
        break;
    }
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setInteracting(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={onBlur}
    >
      <dl className="mb-4 grid grid-cols-[12ch_1fr] gap-x-4 gap-y-1 border-b border-green-dim/40 pb-3">
        <dt className="text-[11px] uppercase tracking-[0.05em] text-text-muted">
          Total Views
        </dt>
        <dd className="text-[13px] tabular-nums text-green-mid">
          {totalViews}
        </dd>
      </dl>
      <ul onKeyDown={onKeyDown}>
        {versions.map((version, index) => (
          <VersionRow
            key={version.id}
            ref={(el) => {
              rowRefs.current[index] = el;
            }}
            version={version}
            index={index}
            active={index === selectedIndex}
            onMouseEnter={() => setSelectedIndex(index)}
            onFocus={() => setSelectedIndex(index)}
          />
        ))}
      </ul>
      <AutoLock target={versions[0]} targetIndex={0} paused={interacting} />
    </div>
  );
}
