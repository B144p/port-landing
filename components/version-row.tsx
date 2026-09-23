import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { FrontendVersion } from "@/features/frontend-version/client";

/**
 * A real <a href> so selection works with zero JS — middle-click,
 * ctrl-click, and native Tab all just work. version-console (client)
 * later attaches a ref and hover/focus handlers to drive the channel
 * cursor; index-based zero-padding and the dot leader are what make
 * the row read as an instrument channel rather than a list item.
 */
export const VersionRow = forwardRef<
  HTMLAnchorElement,
  {
    version: FrontendVersion;
    index: number;
    active?: boolean;
    onMouseEnter?: () => void;
    onFocus?: () => void;
  }
>(function VersionRow(
  { version, index, active = false, onMouseEnter, onFocus },
  ref,
) {
  const channel = String(index).padStart(2, "0");

  return (
    <li className="border-b border-green-dim/40 last:border-b-0">
      <a
        ref={ref}
        href={version.url}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
        className={cn(
          "relative flex flex-col gap-1 border-l-2 px-2 py-3 text-[13px] uppercase tracking-[0.05em]",
          active
            ? "animate-row-flicker border-l-green-bright bg-bg-raised text-green-bright"
            : "border-l-transparent text-green-dim hover:text-green-mid",
        )}
      >
        <span className="flex items-baseline gap-3">
          <span aria-hidden className="w-4 shrink-0 text-green-bright">
            {active ? "▶" : ""}
          </span>
          <span className="w-6 shrink-0 text-text-muted">{channel}</span>
          <span className="shrink-0">{version.title}</span>
          <span
            aria-hidden
            className="min-w-4 flex-1 overflow-hidden whitespace-nowrap tracking-normal normal-case text-text-muted/60"
          >
            {"·".repeat(200)}
          </span>
          <span className="shrink-0 tabular-nums text-text-muted">
            {version.views} {version.views === 1 ? "VIEW" : "VIEWS"}
          </span>
          {active ? (
            <span
              aria-hidden
              className="ml-1 shrink-0 animate-cursor-blink"
            >
              ▮
            </span>
          ) : null}
        </span>
        {version.description ? (
          <span className="pl-[3.25rem] text-[11px] normal-case tracking-normal text-text-muted">
            {version.description}
          </span>
        ) : null}
        {version.thumbnail ? (
          // thumbnail is an untyped TEXT column (could be a data: URI or
          // any host), so next/image's remotePatterns can't safely
          // allowlist it — a plain <img> is the safe fallback.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={version.thumbnail}
            alt=""
            className="ml-[3.25rem] mt-1 h-16 w-auto rounded-lg border border-green-dim object-cover"
          />
        ) : null}
      </a>
    </li>
  );
});
