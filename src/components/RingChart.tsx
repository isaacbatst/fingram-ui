import { useEffect, useRef, useState } from "react";

interface RingChartProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

function getColor(value: number): string {
  if (value > 100) return "var(--color-danger)";
  if (value >= 80) return "var(--color-warning)";
  return "var(--color-success)";
}

export function RingChart({
  value,
  size = 160,
  strokeWidth = 12,
  label,
  className,
}: RingChartProps) {
  const [animated, setAnimated] = useState(false);
  const rafRef = useRef<number>(undefined);

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clampedArc = Math.min(value, 100);
  const offset = circumference - (clampedArc / 100) * circumference;

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => {
      setAnimated(true);
    });
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const displayedOffset = animated ? offset : circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {/* Track circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
        opacity={0.15}
      />

      {/* Fill circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={getColor(value)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={displayedOffset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "center",
          transition: `stroke-dashoffset 0.8s var(--ease-out)`,
        }}
      />

      {/* Percentage text */}
      <text
        x={center}
        y={label ? center - 6 : center}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground"
        style={{
          fontFamily: "var(--font-mono-family)",
          fontSize: size * 0.18,
          fontWeight: 700,
        }}
      >
        {Math.round(value)}%
      </text>

      {/* Optional label */}
      {label && (
        <text
          x={center}
          y={center + size * 0.13}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: size * 0.09,
          }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}
