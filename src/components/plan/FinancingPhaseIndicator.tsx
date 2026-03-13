import type { FinancingPhase } from "@/services/plan.service";

const PHASE_CONFIG: Record<FinancingPhase, { label: string; color: string; pulse: boolean }> = {
  construction: { label: "Construção", color: "var(--color-warning)", pulse: true },
  grace: { label: "Carência", color: "var(--color-warning)", pulse: true },
  amortization: { label: "Amortização", color: "var(--color-info)", pulse: true },
  paid_off: { label: "Quitado", color: "var(--color-success)", pulse: false },
};

interface Props {
  phase: FinancingPhase;
  detail?: string;
}

export function FinancingPhaseIndicator({ phase, detail }: Props) {
  const config = PHASE_CONFIG[phase];
  return (
    <span
      className="inline-flex items-center gap-1 font-sans text-[10px] px-1.5 py-0.5 rounded-full mt-1.5"
      style={{
        color: config.color,
        background: `color-mix(in srgb, ${config.color} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${config.color} 15%, transparent)`,
      }}
    >
      {config.pulse && (
        <span
          className="w-[5px] h-[5px] rounded-full animate-pulse"
          style={{ background: config.color }}
        />
      )}
      {config.label}
      {detail && ` — ${detail}`}
    </span>
  );
}
