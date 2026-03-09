import { Progress } from "@/components/ui/progress";
import type { BoxDTO } from "@/services/api.interface";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface BoxCardProps {
  box: BoxDTO;
}

export function BoxCard({ box }: BoxCardProps) {
  return (
    <div className="min-w-[150px] max-w-[180px] shrink-0 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="font-semibold text-sm text-foreground truncate">
          {box.name}
        </span>
        {box.isDefault && (
          <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full whitespace-nowrap">
            padrão
          </span>
        )}
      </div>

      <div className="text-base font-bold text-foreground font-mono">
        {formatCurrency(box.balance)}
      </div>

      {box.goalAmount != null && box.goalProgress != null && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Meta</span>
            <span>{Math.min(100, Math.round(box.goalProgress))}%</span>
          </div>
          <Progress
            value={Math.min(100, box.goalProgress)}
            filledColor={box.goalProgress >= 100 ? "var(--color-success)" : "var(--color-accent)"}
            bgColor="var(--color-border)"
            className="h-1.5"
          />
          <div className="text-[10px] text-muted-foreground mt-0.5 text-right">
            {formatCurrency(box.goalAmount)}
          </div>
        </div>
      )}
    </div>
  );
}
