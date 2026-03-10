export function AccentGlow() {
  return (
    <div
      className="fixed pointer-events-none z-[1] will-change-transform"
      style={{
        width: "var(--glow-size)",
        height: "var(--glow-size)",
        borderRadius: "50%",
        background: "var(--color-accent)",
        opacity: "var(--glow-opacity)",
        filter: `blur(var(--glow-blur))`,
        top: "-40%",
        left: "50%",
        transform: "translateX(-50%)",
        animation: "duna-glow-pulse 6s ease-in-out infinite",
      }}
    />
  );
}
