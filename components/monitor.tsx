import { cn } from "@/lib/utils";

/**
 * The shared chassis: bezel + corner ticks + optional title bar.
 */
export function Monitor({
  title,
  className,
  contentClassName,
  children,
}: {
  title?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "monitor-chassis monitor-ticks relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-green-dim",
        className,
      )}
    >
      <span aria-hidden className="monitor-ticks-b absolute inset-0 pointer-events-none" />
      {title ? (
        <div className="flex h-6 shrink-0 items-center border-b border-green-dim px-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-green-mid">
            {title}
          </span>
        </div>
      ) : null}
      <div className={cn("min-h-0 flex-1 p-3 xl:p-4", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
