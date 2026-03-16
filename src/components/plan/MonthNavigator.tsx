import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MonthDataDTO } from "@/services/plan.service";
import { formatMonthYear } from "@/utils/plan-dashboard";

interface Props {
  projection: MonthDataDTO[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function MonthNavigator({ projection, selectedIndex, onChange }: Props) {
  const max = projection.length - 1;
  const current = projection[selectedIndex];

  const goBack = useCallback(() => {
    if (selectedIndex > 0) onChange(selectedIndex - 1);
  }, [selectedIndex, onChange]);

  const goForward = useCallback(() => {
    if (selectedIndex < max) onChange(selectedIndex + 1);
  }, [selectedIndex, max, onChange]);

  return (
    <div className="flex items-center justify-center gap-3 py-3 sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md">
      <button
        onClick={goBack}
        disabled={selectedIndex === 0}
        aria-label="Mês anterior"
        className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] transition-colors enabled:hover:bg-[var(--color-bg-surface-hover)] enabled:hover:text-[var(--color-accent)] disabled:opacity-25"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="text-center min-w-[120px]">
        <div className="font-mono text-sm text-foreground">
          {current ? formatMonthYear(current.date) : "—"}
        </div>
        <div className="font-sans text-[10px] text-[var(--color-text-muted)]">
          mês {selectedIndex + 1} de {max + 1}
        </div>
      </div>

      <button
        onClick={goForward}
        disabled={selectedIndex === max}
        aria-label="Próximo mês"
        className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] transition-colors enabled:hover:bg-[var(--color-bg-surface-hover)] enabled:hover:text-[var(--color-accent)] disabled:opacity-25"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
