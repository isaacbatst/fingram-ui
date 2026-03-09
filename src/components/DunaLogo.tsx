interface DunaLogoProps {
  size?: number;
  showWordmark?: boolean;
}

export function DunaLogo({ size = 28, showWordmark = false }: DunaLogoProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 64 64">
        {/* Container */}
        <rect width="64" height="64" rx="14" fill="#0e1015" />
        {/* 5 strata bars forming the letter D — opacity increasing top→bottom */}
        <rect x="14" y="10" width="22" height="5" rx="2.5" fill="#d9af78" opacity="0.15" />
        <rect x="14" y="20" width="30" height="5" rx="2.5" fill="#d9af78" opacity="0.3" />
        <rect x="14" y="30" width="34" height="5" rx="2.5" fill="#d9af78" opacity="0.5" />
        <rect x="14" y="40" width="30" height="5" rx="2.5" fill="#d9af78" opacity="0.75" />
        <rect x="14" y="50" width="22" height="5" rx="2.5" fill="#e8c99b" opacity="1" />
      </svg>
      {showWordmark && (
        <span
          style={{
            fontFamily: "'DM Serif Text', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: size * 0.75,
            color: "var(--color-accent)",
            lineHeight: 1,
            letterSpacing: -0.3,
          }}
        >
          duna
        </span>
      )}
    </span>
  );
}
