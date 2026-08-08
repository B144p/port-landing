/**
 * Background: fixed behind everything. Void base + drifting CRT grid
 * + radial vignette. The grid element is oversized and animated with a
 * transform (never background-position) so it stays on the compositor.
 */
export function BackgroundLayer() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-bg-void">
      <div
        className="animate-grid-drift absolute -inset-[5%]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              to bottom,
              rgba(51, 204, 102, 0.06) 0px,
              rgba(51, 204, 102, 0.06) 1px,
              transparent 1px,
              transparent 32px
            ),
            repeating-linear-gradient(
              to right,
              rgba(51, 204, 102, 0.06) 0px,
              rgba(51, 204, 102, 0.06) 1px,
              transparent 1px,
              transparent 32px
            )
          `,
          animation: "grid-drift 8s linear infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(2, 6, 4, 0.85) 100%)",
        }}
      />
    </div>
  );
}
