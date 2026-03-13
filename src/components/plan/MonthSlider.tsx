import type { MonthDataDTO } from "@/services/plan.service";
import type { DerivedMilestone } from "@/utils/plan-dashboard";
import { formatMonthYear } from "@/utils/plan-dashboard";

interface Props {
  projection: MonthDataDTO[];
  milestones: DerivedMilestone[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function MonthSlider({ projection, milestones, selectedIndex, onChange }: Props) {
  const max = projection.length - 1;
  const current = projection[selectedIndex];
  const fillPct = max > 0 ? (selectedIndex / max) * 100 : 0;

  return (
    <div className="my-3">
      {/* Label */}
      <div className="text-center mb-2">
        <div className="font-mono text-sm text-foreground">
          {current ? formatMonthYear(current.date) : "—"}
        </div>
        <div className="font-sans text-[10px] text-[var(--color-text-muted)]">
          mês {selectedIndex} de {max}
        </div>
      </div>

      {/* Slider track with milestone dots */}
      <div className="relative px-2">
        <input
          type="range"
          min={0}
          max={max}
          value={selectedIndex}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Selecionar mês da projeção"
          className="month-slider w-full"
          style={{
            background: `linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-dim) ${fillPct}%, rgba(217,175,120,0.08) ${fillPct}%)`,
          }}
        />
        {/* Milestone dots */}
        {max > 0 && milestones.map((m) => {
          const idx = projection.findIndex((p) => p.month === m.month);
          if (idx < 0) return null;
          const pct = (idx / max) * 100;
          return (
            <div
              key={m.boxId}
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-accent-dim)] pointer-events-none"
              style={{ left: `calc(${pct}% + 8px - ${pct * 16 / 100}px)` }}
              title={m.label}
            />
          );
        })}
      </div>
    </div>
  );
}
