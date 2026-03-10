export function AccentGlow() {
  return (
    <div
      className="fixed pointer-events-none z-[1]"
      style={{
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "var(--color-accent)",
        opacity: 0.25,
        filter: "blur(150px)",
        top: "-40%",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    />
  );
}
