export function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] will-change-[opacity]"
      style={{
        opacity: "var(--grain-opacity)",
        mixBlendMode: "var(--grain-blend)" as React.CSSProperties["mixBlendMode"],
      }}
    >
      <svg width="100%" height="100%" className="block">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
