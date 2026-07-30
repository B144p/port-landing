import Link from "next/link";

export function ErrorState() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-[13px] uppercase tracking-[0.05em] text-red-alert">
        LINK FAILURE // RETRY
      </p>
      <Link
        href="/"
        className="border border-red-alert px-3 py-1 text-[11px] uppercase tracking-[0.05em] text-red-alert hover:bg-red-alert/10"
      >
        [ RETRY ]
      </Link>
    </div>
  );
}

export function EmptyState({
  label = "NO VERSIONS PUBLISHED // MODULE OFFLINE",
}: {
  label?: string;
}) {
  return (
    <div className="flex h-full min-h-32 items-center justify-center rounded-lg border border-green-dim">
      <p className="text-[13px] uppercase tracking-[0.05em] text-text-muted">
        {label} <span className="animate-pulse">▮</span>
      </p>
    </div>
  );
}
