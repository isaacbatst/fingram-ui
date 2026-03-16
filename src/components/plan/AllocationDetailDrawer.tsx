import { ArrowRight } from "lucide-react";
import type { AllocationDTO, MonthDataDTO, FinancingMonthDetailDTO } from "@/services/plan.service";
import type { BoxDTO } from "@/services/api.interface";
import type { DerivedMilestone } from "@/utils/plan-dashboard";
import { formatCurrency, formatMonthYear, getActiveMonthlyAmount } from "@/utils/plan-dashboard";
import { getBoxColor } from "@/utils/box-colors";
import { FinancingPhaseIndicator } from "./FinancingPhaseIndicator";
import { useBindAllocation } from "@/hooks/useBindAllocation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  allocation: AllocationDTO | null;
  allocations: AllocationDTO[];
  lastMonth: MonthDataDTO;
  milestones: DerivedMilestone[];
  projection: MonthDataDTO[];
  planId: string;
  savingBoxes: BoxDTO[];
  onClose: () => void;
}

export function AllocationDetailDrawer({
  allocation,
  allocations,
  lastMonth,
  milestones,
  projection,
  planId,
  savingBoxes,
  onClose,
}: Props) {
  const { bind, isLoading: bindLoading } = useBindAllocation(planId);

  if (!allocation) {
    return (
      <Drawer open={false} onOpenChange={() => onClose()}>
        <DrawerContent />
      </Drawer>
    );
  }

  const color = getBoxColor(allocations, allocation.id);
  const balance = lastMonth.allocations[allocation.id] ?? 0;
  const hasTarget = allocation.target > 0;
  const progress = hasTarget ? Math.min(100, (balance / allocation.target) * 100) : null;
  const isComplete = hasTarget && balance >= allocation.target;
  const currentMonthly = getActiveMonthlyAmount(allocation.monthlyAmount, lastMonth.month);
  const financing: FinancingMonthDetailDTO | undefined = lastMonth.financingDetails[allocation.id];
  const milestone = milestones.find((m) => m.boxId === allocation.id);
  const etaMonth = milestone ? projection.find((m) => m.month === milestone.month) : null;
  const isHoldsFunds = allocation.holdsFunds;

  const linkedBox = isHoldsFunds && allocation.estratoId
    ? savingBoxes.find((b) => b.id === allocation.estratoId)
    : null;

  const allocationId = allocation.id;
  function handleSelectChange(value: string) {
    const estratoId = value === '__none__' ? null : value;
    bind(allocationId, estratoId);
  }

  return (
    <Drawer open={!!allocation} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="border-[var(--color-border)]">
        <DrawerHeader className="pb-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1 h-8 rounded-sm shrink-0"
              style={{ background: color }}
            />
            <div>
              <DrawerTitle className="font-display text-lg text-foreground">
                {allocation.label}
              </DrawerTitle>
              <DrawerDescription className="font-sans text-[11px] text-[var(--color-text-muted)]">
                {isHoldsFunds ? "Reservado para você" : "Pago a terceiros"}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 pt-4 flex flex-col gap-4">
          {/* Balance + target */}
          <div>
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-2xl font-semibold text-foreground">
                {formatCurrency(balance)}
              </span>
              {hasTarget && (
                <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                  de {formatCurrency(allocation.target)}
                </span>
              )}
            </div>
            {progress !== null && (
              <div className="h-1.5 bg-[rgba(240,232,220,0.06)] rounded-sm overflow-hidden mt-2">
                <div
                  className="h-full rounded-sm transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%`, background: color }}
                />
              </div>
            )}
          </div>

          {/* Monthly + ETA row */}
          <div className="flex justify-between items-center p-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)]">
            <div>
              <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] block mb-0.5">
                Aporte mensal
              </span>
              <span className="font-mono text-sm text-foreground">
                {formatCurrency(currentMonthly)}/mês
                {financing && financing.phase === "construction" && (
                  <span className="text-[var(--color-text-muted)]"> (juros obra)</span>
                )}
              </span>
            </div>
            <div className="text-right">
              <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] block mb-0.5">
                {isComplete ? "Status" : "Previsão"}
              </span>
              {isComplete ? (
                <span className="font-sans text-sm text-[var(--color-success)]">Completo</span>
              ) : etaMonth ? (
                <span className="font-mono text-sm text-foreground">
                  {formatMonthYear(etaMonth.date)}
                </span>
              ) : hasTarget ? (
                <span className="font-mono text-sm text-[var(--color-text-muted)]">
                  ~Mês {lastMonth.month}+
                </span>
              ) : (
                <span className="font-sans text-sm text-[var(--color-text-muted)]">—</span>
              )}
            </div>
          </div>

          {/* Financing phase */}
          {financing && <FinancingPhaseIndicator phase={financing.phase} />}

          {/* Estrato binding */}
          {isHoldsFunds && (
            <div>
              <span className="font-sans text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block">
                Estrato vinculado
              </span>
              <Select
                value={allocation.estratoId ?? '__none__'}
                onValueChange={handleSelectChange}
                disabled={bindLoading}
              >
                <SelectTrigger
                  size="sm"
                  className="w-full font-sans text-xs min-h-[44px] border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]"
                >
                  <SelectValue placeholder="Vincular estrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-[var(--color-text-muted)] italic">Sem vínculo</span>
                  </SelectItem>
                  {savingBoxes.map((box) => (
                    <SelectItem key={box.id} value={box.id}>
                      {linkedBox?.id === box.id ? (
                        <span className="font-medium">{box.name}</span>
                      ) : (
                        box.name
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Scheduled movements */}
          {allocation.scheduledMovements.length > 0 && (
            <div>
              <span className="font-sans text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2 block">
                Movimentações programadas
              </span>
              <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                {allocation.scheduledMovements.map((sm, i) => {
                  const isIn = sm.type === 'in';
                  const dotColor = isIn ? 'var(--color-success)' : 'var(--color-danger)';
                  const destination = sm.type === 'out'
                    ? (sm.destinationBoxId ? allocations.find(b => b.id === sm.destinationBoxId)?.label ?? 'Caixa' : 'Caixa')
                    : null;
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: dotColor }}
                        />
                        <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                          Mês {sm.month}
                        </span>
                        <span className="font-sans text-[11px] text-[var(--color-text-secondary)] truncate">
                          {sm.label}
                          {destination && (
                            <span className="text-[var(--color-text-muted)]">
                              <ArrowRight className="inline w-2.5 h-2.5 align-middle -mt-px mx-1" />
                              {destination}
                            </span>
                          )}
                        </span>
                      </div>
                      <span
                        className="font-mono text-[11px] shrink-0"
                        style={{ color: isIn ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
                      >
                        {isIn ? '+' : '−'}{formatCurrency(sm.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
