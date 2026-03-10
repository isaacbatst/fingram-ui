import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// ─── Shared: Strata cross-section (SVG) ────────────────────────
// 7 horizontal layers with decreasing opacity (oldest at bottom)
const LAYERS = [
  { opacity: 0.03, y: 0 },
  { opacity: 0.05, y: 1 },
  { opacity: 0.07, y: 2 },
  { opacity: 0.09, y: 3 },
  { opacity: 0.12, y: 4 },
  { opacity: 0.16, y: 5 },
  { opacity: 0.22, y: 6 },
];

const LAYER_H = 14;
const STRATA_H = LAYERS.length * LAYER_H;

// ─── ISA-85: Grão — new layer materializes ──────────────────────
// A new bright layer fades in at the top and the whole strata
// shifts down, like sediment depositing.
function GrainAnimation() {
  const [phase, setPhase] = useState<"idle" | "depositing" | "settled">(
    "idle",
  );

  const trigger = useCallback(() => {
    setPhase("idle");
    requestAnimationFrame(() => {
      setPhase("depositing");
      setTimeout(() => setPhase("settled"), 600);
      setTimeout(() => setPhase("idle"), 2500);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-foreground">
            Grão caindo sobre camada
          </h3>
          <p className="text-sm text-muted-foreground">
            ISA-85 — Aporte registrado
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={trigger}>
          Simular
        </Button>
      </div>
      <svg
        viewBox={`0 0 400 ${STRATA_H + LAYER_H}`}
        className="w-full rounded-lg overflow-hidden"
        style={{ background: "var(--color-bg)" }}
        preserveAspectRatio="none"
      >
        {/* Existing layers — shift down when depositing */}
        <g
          style={{
            transform:
              phase !== "idle"
                ? `translateY(${LAYER_H}px)`
                : "translateY(0)",
            transition: "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {LAYERS.map((l, i) => (
            <rect
              key={i}
              x={0}
              y={i * LAYER_H}
              width={400}
              height={LAYER_H}
              fill="#d9af78"
              opacity={l.opacity}
            />
          ))}
        </g>
        {/* New layer — materializes at the top */}
        <rect
          x={0}
          y={0}
          width={400}
          height={LAYER_H}
          fill="#d9af78"
          style={{
            opacity: phase === "idle" ? 0 : phase === "depositing" ? 0.3 : 0.22,
            transition:
              phase === "idle"
                ? "opacity 600ms ease"
                : "opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Glow line at deposit edge */}
        <rect
          x={0}
          y={LAYER_H - 1}
          width={400}
          height={2}
          fill="#d9af78"
          style={{
            opacity: phase === "depositing" ? 0.5 : 0,
            transition: "opacity 400ms ease",
          }}
        />
      </svg>
    </div>
  );
}

// ─── ISA-86: Marco — horizontal light sweep ─────────────────────
// A warm horizontal beam of light sweeps across the strata,
// like sunlight hitting a geological cross-section.
function MilestoneGlow() {
  const [active, setActive] = useState(false);

  const trigger = useCallback(() => {
    setActive(false);
    requestAnimationFrame(() => {
      setActive(true);
      setTimeout(() => setActive(false), 1800);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-foreground">
            Camada pulsa com glow
          </h3>
          <p className="text-sm text-muted-foreground">
            ISA-86 — Marco atingido
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={trigger}>
          Simular
        </Button>
      </div>
      <svg
        viewBox={`0 0 400 ${STRATA_H}`}
        className="w-full rounded-lg overflow-hidden"
        style={{ background: "var(--color-bg)" }}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow-blur">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id="sweep-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d9af78" stopOpacity="0" />
            <stop offset="40%" stopColor="#d9af78" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#d9af78" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#d9af78" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d9af78" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Base strata */}
        {LAYERS.map((l, i) => (
          <rect
            key={i}
            x={0}
            y={i * LAYER_H}
            width={400}
            height={LAYER_H}
            fill="#d9af78"
            opacity={l.opacity}
          />
        ))}
        {/* Light sweep — moves left to right */}
        <rect
          x={0}
          y={0}
          width={120}
          height={STRATA_H}
          fill="url(#sweep-grad)"
          filter="url(#glow-blur)"
          style={{
            transform: active ? "translateX(400px)" : "translateX(-120px)",
            transition: active
              ? "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
            opacity: active ? 1 : 0,
          }}
        />
        {/* Afterglow — all layers briefly brighten */}
        <rect
          x={0}
          y={0}
          width={400}
          height={STRATA_H}
          fill="#d9af78"
          style={{
            opacity: active ? 0.06 : 0,
            transition: active
              ? "opacity 800ms ease-in 400ms"
              : "opacity 600ms ease-out",
          }}
        />
      </svg>
    </div>
  );
}

// ─── ISA-87: Desvio — wave distortion ───────────────────────────
// Layers physically undulate using a sine-wave displacement,
// like a tremor passing through sediment.
function DeviationRipple() {
  const [active, setActive] = useState(false);
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  const animate = useCallback((ts: number) => {
    if (!startRef.current) startRef.current = ts;
    const elapsed = ts - startRef.current;
    setTime(elapsed);
    if (elapsed < 1000) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      setActive(false);
      setTime(0);
    }
  }, []);

  const trigger = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    startRef.current = 0;
    setActive(true);
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Wave displacement per layer
  const getDisplacement = (layerIndex: number) => {
    if (!active || time === 0) return 0;
    const progress = time / 1000;
    // Damped sine wave — amplitude decreases over time
    const amplitude = 4 * Math.max(0, 1 - progress);
    const frequency = 3;
    const phase = layerIndex * 0.8; // phase offset per layer
    return amplitude * Math.sin(frequency * Math.PI * 2 * progress - phase);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-foreground">
            Ondulação na camada
          </h3>
          <p className="text-sm text-muted-foreground">
            ISA-87 — Desvio detectado
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={trigger}>
          Simular
        </Button>
      </div>
      <svg
        viewBox={`0 0 400 ${STRATA_H}`}
        className="w-full rounded-lg overflow-hidden"
        style={{ background: "var(--color-bg)" }}
        preserveAspectRatio="none"
      >
        {LAYERS.map((l, i) => {
          const dx = getDisplacement(i);
          return (
            <rect
              key={i}
              x={0}
              y={i * LAYER_H}
              width={400}
              height={LAYER_H}
              fill={active ? "#d4a04a" : "#d9af78"}
              opacity={l.opacity + (active ? 0.03 : 0)}
              style={{
                transform: `translateX(${dx}px)`,
              }}
            />
          );
        })}
        {/* Warning tint flash */}
        <rect
          x={0}
          y={0}
          width={400}
          height={STRATA_H}
          fill="#d4a04a"
          style={{
            opacity: active ? 0.04 * Math.max(0, 1 - time / 1000) : 0,
          }}
        />
      </svg>
    </div>
  );
}

// ─── Showcase page ──────────────────────────────────────────────
export function AnimationShowcase() {
  return (
    <div className="flex flex-col gap-10 px-4 py-8 max-w-lg mx-auto">
      <div>
        <h2 className="font-display text-2xl text-foreground tracking-tight">
          Animações Estratos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Protótipos visuais das metáforas do design system. Cada animação
          opera diretamente sobre a seção transversal dos estratos.
        </p>
      </div>
      <GrainAnimation />
      <MilestoneGlow />
      <DeviationRipple />
    </div>
  );
}
