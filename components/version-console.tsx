"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { VersionRow } from "@/components/version-row";
import type { FrontendVersion } from "@/lib/types";

/**
 * Owns the channel cursor: arrow keys, Home/End, hover, and native
 * focus all move `selectedIndex` and keep DOM focus in sync with it,
 * so Tab order and the ▶ cursor never disagree about which row is
 * "current".
 */
export function VersionConsole({
  versions,
  totalViews,
}: {
  versions: FrontendVersion[];
  totalViews: number;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([]);

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

  return (
    <>
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
    </>
  );
}
