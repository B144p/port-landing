/**
 * Scanline overlay — on top of everything, non-interactive.
 * 2px pitch, ~4% opacity (halved below 768px where it reads heavier).
 */
export function Scanlines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.02] md:opacity-[0.04]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(102, 255, 153, 1) 0px, rgba(102, 255, 153, 1) 1px, transparent 1px, transparent 2px)",
      }}
    />
  );
}
