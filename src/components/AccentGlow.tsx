export function AccentGlow() {
  return (
    <div
      className="fixed pointer-events-none z-0"
      style={{
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "var(--color-accent)",
        opacity: 0.04,
        filter: "blur(120px)",
        top: "8%",
        right: "5%",
      }}
    />
  );
}
