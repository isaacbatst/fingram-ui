import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useCreatePlan } from "@/hooks/useCreatePlan";
import { usePlans } from "@/hooks/usePlans";
import { useProjection } from "@/hooks/useProjection";
import { planService, type FundRuleDTO, type MonthDataDTO, type PlanDTO } from "@/services/plan.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { mutate } from "swr";

const FUND_COLORS = [
  { fill: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#b45309" },
  { fill: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", text: "#047857" },
  { fill: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", text: "#1d4ed8" },
  { fill: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)", text: "#7c3aed" },
  { fill: "#f43e5e", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)", text: "#be123c" },
  { fill: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)", text: "#0e7490" },
  { fill: "#84cc16", bg: "rgba(132,204,22,0.08)", border: "rgba(132,204,22,0.2)", text: "#4d7c0f" },
  { fill: "#ec4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)", text: "#be185d" },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getMonthYear(startDate: string, monthOffset: number) {
  const base = new Date(startDate);
  const d = new Date(base.getFullYear(), base.getMonth() + monthOffset);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

function ProgressRing({
  value,
  max,
  size = 68,
  stroke = 5,
  color,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color: string;
  children: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function FundCard({
  label,
  current,
  target,
  colorIndex,
  done,
}: {
  label: string;
  current: number;
  target: number;
  colorIndex: number;
  done: boolean;
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const c = FUND_COLORS[colorIndex % FUND_COLORS.length];

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: c.bg,
        border: `1px solid ${done ? c.fill + "44" : c.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: c.text }}
        >
          {label}
        </span>
        {done && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: c.fill + "1a", color: c.fill }}
          >
            Completo
          </span>
        )}
      </div>
      <div className="text-xl font-bold tabular-nums text-gray-900">
        {formatBRL(current)}
      </div>
      <div className="text-[11px] text-gray-400 mt-0.5 mb-3">
        meta {formatBRL(target)}
      </div>
      <Progress
        value={pct}
        className="h-1"
        filledColor={c.fill}
        bgColor={c.fill + "1a"}
      />
      <div
        className="text-[11px] mt-1.5 text-right tabular-nums font-medium"
        style={{ color: c.text }}
      >
        {pct.toFixed(0)}%
      </div>
    </div>
  );
}

function StackedChart({
  projection,
  funds,
  currentMonth,
  onMonthClick,
}: {
  projection: MonthDataDTO[];
  funds: FundRuleDTO[];
  currentMonth: number;
  onMonthClick: (month: number) => void;
}) {
  const chartData = useMemo(() => {
    // Sample projection for chart (max ~20 bars for mobile)
    const step = Math.max(1, Math.floor(projection.length / 18));
    const sampled: MonthDataDTO[] = [];
    for (let i = 0; i < projection.length; i += step) {
      sampled.push(projection[i]);
    }
    // Always include last
    if (sampled[sampled.length - 1]?.month !== projection[projection.length - 1]?.month) {
      sampled.push(projection[projection.length - 1]);
    }

    return sampled.map((d) => {
      const fundValues = funds.map((f) => Math.max(d.funds[f.fundId] ?? 0, 0));
      const total = fundValues.reduce((s, v) => s + v, 0);
      return { month: d.month, fundValues, total };
    });
  }, [projection, funds]);

  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
      <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-4">
        Evolucao patrimonial
      </div>
      <div className="flex items-end gap-[3px]" style={{ height: 140 }}>
        {chartData.map((d) => {
          const h = (d.total / (maxTotal * 1.1)) * 140;
          const isActive = d.month <= currentMonth;
          return (
            <div
              key={d.month}
              className="flex-1 rounded-t-sm overflow-hidden cursor-pointer transition-opacity"
              style={{
                height: h,
                opacity: isActive ? 1 : 0.25,
                display: "flex",
                flexDirection: "column-reverse",
              }}
              title={`Mes ${d.month}: ${formatBRL(d.total)}`}
              onClick={() => onMonthClick(d.month)}
            >
              {d.fundValues.map((val, fi) => {
                const pct = d.total > 0 ? (val / d.total) * 100 : 0;
                const c = FUND_COLORS[fi % FUND_COLORS.length];
                return (
                  <div
                    key={fi}
                    style={{
                      height: `${pct}%`,
                      background: c.fill,
                      transition: "height 0.4s ease",
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {chartData
          .filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 5)) === 0 || i === chartData.length - 1)
          .map((d) => (
            <span key={d.month} className="text-[9px] text-gray-300 tabular-nums">
              M{d.month}
            </span>
          ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {funds.map((f, i) => {
          const c = FUND_COLORS[i % FUND_COLORS.length];
          return (
            <div key={f.fundId} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ background: c.fill }}
              />
              <span className="text-[10px] text-gray-400">{f.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanDashboard({ planId, onDelete }: { planId: string; onDelete: () => void }) {
  const { projection, isLoading } = useProjection(planId);
  const { plans } = usePlans();
  const plan = plans?.find((p) => p.id === planId);
  const [currentMonth, setCurrentMonth] = useState(0);

  const sortedFunds = useMemo(
    () =>
      plan
        ? [...plan.fundAllocation].sort((a, b) => a.priority - b.priority)
        : [],
    [plan],
  );

  // Derive milestones from projection data
  const milestones = useMemo(() => {
    if (!projection || sortedFunds.length === 0) return [];

    const items: {
      month: number;
      label: string;
      type: "start" | "fund_complete" | "all_complete";
      colorIndex: number;
    }[] = [];

    items.push({ month: 1, label: "Inicio do plano", type: "start", colorIndex: 0 });

    for (let fi = 0; fi < sortedFunds.length; fi++) {
      const fund = sortedFunds[fi];
      if (fund.target <= 0) continue;
      const completionMonth = projection.findIndex(
        (m) => (m.funds[fund.fundId] ?? 0) >= fund.target,
      );
      if (completionMonth >= 0) {
        items.push({
          month: projection[completionMonth].month,
          label: `${fund.label} completo`,
          type: "fund_complete",
          colorIndex: fi,
        });
      }
    }

    const allCompleteMonth = projection.findIndex((m) =>
      sortedFunds.every(
        (f) => f.target <= 0 || (m.funds[f.fundId] ?? 0) >= f.target,
      ),
    );
    if (allCompleteMonth >= 0) {
      items.push({
        month: projection[allCompleteMonth].month,
        label: "Todos os fundos completos!",
        type: "all_complete",
        colorIndex: 1,
      });
    }

    return items.sort((a, b) => a.month - b.month);
  }, [projection, sortedFunds]);

  const monthData: MonthDataDTO | undefined = projection?.[currentMonth];

  const nextMilestones = useMemo(
    () =>
      monthData
        ? milestones.filter((m) => m.month >= monthData.month).slice(0, 3)
        : [],
    [milestones, monthData],
  );

  const nextFundCompletion = useMemo(
    () =>
      monthData
        ? milestones.find(
            (m) => m.type === "fund_complete" && m.month >= monthData.month,
          )
        : undefined,
    [milestones, monthData],
  );

  if (isLoading || !projection || !plan) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        Carregando projecao...
      </div>
    );
  }

  if (!monthData) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Sem dados de projecao
      </div>
    );
  }

  const totalMonths = projection.length - 1;

  const totalPatrimonio = Object.values(monthData.funds).reduce(
    (sum, v) => sum + Math.max(v, 0),
    0,
  );

  const totalTarget = sortedFunds.reduce((s, f) => s + f.target, 0);
  const overallPct = totalTarget > 0 ? Math.min((totalPatrimonio / totalTarget) * 100, 100) : 0;

  const currentFundIndex = sortedFunds.findIndex((f) => {
    const val = Math.max(monthData.funds[f.fundId] ?? 0, 0);
    return val < f.target;
  });
  const activeColorIdx = currentFundIndex >= 0 ? currentFundIndex : sortedFunds.length - 1;
  const activeColor = FUND_COLORS[activeColorIdx % FUND_COLORS.length];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Fixed top: Header + Slider */}
      <div className="space-y-4 pb-4 shrink-0">
        {/* Header */}
        <div className="flex items-center gap-4">
          <ProgressRing
            value={currentMonth}
            max={totalMonths}
            size={64}
            stroke={4}
            color={activeColor.fill}
          >
            <div className="text-center">
              <div className="text-base font-bold tabular-nums leading-none text-gray-900">
                {currentMonth}
              </div>
              <div className="text-[9px] text-gray-400 tracking-wide">
                /{totalMonths}
              </div>
            </div>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {plan.name}
            </h2>
            <p className="text-xs text-gray-400 tabular-nums">
              {getMonthYear(plan.startDate, currentMonth)}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar plano</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja apagar &quot;{plan.name}&quot;? Essa acao nao pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    try {
                      await planService.deletePlan(planId);
                      mutate("plans");
                      toast.success("Plano apagado");
                      onDelete();
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Erro ao apagar plano";
                      toast.error(msg);
                    }
                  }}
                >
                  Apagar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Month Slider */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-400 font-medium">
              Simular mes
            </span>
            <span className="text-[11px] text-gray-500 tabular-nums font-medium">
              Mes {currentMonth} · {getMonthYear(plan.startDate, currentMonth)}
            </span>
          </div>
          <Slider
            value={[currentMonth]}
            onValueChange={([v]) => setCurrentMonth(v)}
            min={0}
            max={totalMonths}
            step={1}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-2 pr-2">

      {/* Patrimonio Total */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${activeColor.bg}, transparent)`,
          border: `1px solid ${activeColor.border}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
              Patrimonio acumulado
            </div>
            <div
              className="text-2xl font-bold tabular-nums"
              style={{ color: activeColor.text }}
            >
              {formatBRL(totalPatrimonio)}
            </div>
          </div>
          <ProgressRing
            value={overallPct}
            max={100}
            size={52}
            stroke={4}
            color={activeColor.fill}
          >
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: activeColor.text }}
            >
              {overallPct.toFixed(0)}%
            </span>
          </ProgressRing>
        </div>
      </div>

      {/* Fund Cards */}
      <div className="grid grid-cols-2 gap-3">
        {sortedFunds.map((fund, i) => {
          const current = Math.max(monthData.funds[fund.fundId] ?? 0, 0);
          return (
            <FundCard
              key={fund.fundId}
              label={fund.label}
              current={current}
              target={fund.target}
              colorIndex={i}
              done={current >= fund.target}
            />
          );
        })}
      </div>

      {/* Next milestones + Next fund completion */}
      {(nextMilestones.length > 0 || nextFundCompletion) && (
        <div className="flex gap-3 flex-col sm:flex-row">
          {/* Next milestones */}
          {nextMilestones.length > 0 && (
            <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-3">
                Proximos marcos
              </div>
              <div className="space-y-2.5">
                {nextMilestones.map((m, i) => {
                  const c = FUND_COLORS[m.colorIndex % FUND_COLORS.length];
                  const monthsAway = m.month - monthData.month;
                  return (
                    <div
                      key={`${m.month}-${m.label}`}
                      className="flex items-start gap-2.5 cursor-pointer"
                      style={{ opacity: 1 - i * 0.2 }}
                      onClick={() => setCurrentMonth(m.month - 1)}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: c.fill }}
                      />
                      <div>
                        <span className="text-[13px] text-gray-700">
                          {m.label}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-2 tabular-nums">
                          mes {m.month} · {monthsAway > 0 ? `em ${monthsAway}m` : "agora"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next fund completion */}
          {nextFundCompletion && (
            <div
              className="rounded-2xl p-4 cursor-pointer sm:w-44 shrink-0"
              style={{
                background: FUND_COLORS[nextFundCompletion.colorIndex % FUND_COLORS.length].bg,
                border: `1px solid ${FUND_COLORS[nextFundCompletion.colorIndex % FUND_COLORS.length].border}`,
              }}
              onClick={() => setCurrentMonth(nextFundCompletion.month - 1)}
            >
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
                Proximo fundo
              </div>
              <div
                className="text-sm font-bold mb-1"
                style={{ color: FUND_COLORS[nextFundCompletion.colorIndex % FUND_COLORS.length].text }}
              >
                {nextFundCompletion.label}
              </div>
              <div className="text-[11px] text-gray-400 tabular-nums">
                mes {nextFundCompletion.month} · {getMonthYear(plan.startDate, nextFundCompletion.month - 1)}
              </div>
              <div className="text-[11px] text-gray-300 tabular-nums mt-0.5">
                {nextFundCompletion.month - monthData.month > 0
                  ? `em ${nextFundCompletion.month - monthData.month} meses`
                  : "agora"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stacked Chart */}
      {projection.length > 1 && (
        <StackedChart
          projection={projection}
          funds={sortedFunds}
          currentMonth={currentMonth}
          onMonthClick={setCurrentMonth}
        />
      )}

      {/* Month Details */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
        <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-3">
          Detalhes do mes {currentMonth}
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Receita</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {formatBRL(monthData.income)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Despesas</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {formatBRL(monthData.expenses)}
            </span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between">
            <span className="text-gray-500">Sobra</span>
            <span
              className={`font-bold tabular-nums ${monthData.surplus >= 0 ? "text-emerald-600" : "text-red-500"}`}
            >
              {formatBRL(monthData.surplus)}
            </span>
          </div>
        </div>

        {/* Per-fund allocation this month */}
        {sortedFunds.length > 0 && (
          <>
            <div className="h-px bg-gray-100 my-3" />
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
              Saldo por fundo
            </div>
            <div className="space-y-2">
              {sortedFunds.map((fund, i) => {
                const val = Math.max(monthData.funds[fund.fundId] ?? 0, 0);
                const c = FUND_COLORS[i % FUND_COLORS.length];
                const pct = fund.target > 0 ? Math.min((val / fund.target) * 100, 100) : 0;
                return (
                  <div key={fund.fundId}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-sm"
                          style={{ background: c.fill }}
                        />
                        <span className="text-xs text-gray-500">
                          {fund.label}
                        </span>
                      </div>
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: c.text }}
                      >
                        {formatBRL(val)}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-1"
                      filledColor={c.fill}
                      bgColor={c.fill + "12"}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Complete Timeline */}
      {milestones.length > 1 && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
          <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-4">
            Timeline completa
          </div>
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-100" />
            {milestones.map((m) => {
              const c = FUND_COLORS[m.colorIndex % FUND_COLORS.length];
              const isPast = m.month < monthData.month;
              const isCurrent = m.month === monthData.month;
              return (
                <div
                  key={`${m.month}-${m.label}`}
                  className="flex items-center gap-3 mb-4 last:mb-0 cursor-pointer transition-opacity"
                  style={{ opacity: isPast ? 0.4 : 1 }}
                  onClick={() => setCurrentMonth(m.month - 1)}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 relative z-10 flex items-center justify-center"
                    style={{
                      background: isCurrent ? c.fill : isPast ? "#e5e7eb" : "white",
                      border: `2px solid ${isCurrent ? c.fill : isPast ? "#d1d5db" : c.fill + "66"}`,
                      boxShadow: isCurrent ? `0 0 8px ${c.fill}44` : "none",
                    }}
                  >
                    {isPast && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="pt-px flex items-center">
                    <span
                      className="text-[13px]"
                      style={{
                        fontWeight: isCurrent ? 700 : 400,
                        color: isCurrent ? c.text : "#374151",
                      }}
                    >
                      {m.label}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-2 tabular-nums">
                      mes {m.month} · {getMonthYear(plan.startDate, m.month - 1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>{/* end scrollable */}
    </div>
  );
}

function CreatePlanForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { createPlan, isLoading } = useCreatePlan();
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [monthlyInvestment, setMonthlyInvestment] = useState("");
  const [funds, setFunds] = useState<
    { label: string; target: string; fundId: string }[]
  >([{ label: "", target: "", fundId: crypto.randomUUID() }]);

  const addFund = () => {
    setFunds([...funds, { label: "", target: "", fundId: crypto.randomUUID() }]);
  };

  const removeFund = (index: number) => {
    setFunds(funds.filter((_, i) => i !== index));
  };

  const updateFund = (
    index: number,
    field: "label" | "target",
    value: string,
  ) => {
    const updated = [...funds];
    updated[index] = { ...updated[index], [field]: value };
    setFunds(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fundAllocation: FundRuleDTO[] = funds
      .filter((f) => f.label && f.target)
      .map((f, i) => ({
        fundId: f.fundId,
        label: f.label,
        target: Number(f.target),
        priority: i + 1,
      }));

    const plan = await createPlan({
      name,
      premises: {
        salary: Number(salary),
        monthlyCost: Number(monthlyCost),
        monthlyInvestment: monthlyInvestment
          ? Number(monthlyInvestment)
          : undefined,
      },
      fundAllocation,
    });

    if (plan) {
      onCreated(plan.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="plan-name">Nome do plano</Label>
        <Input
          id="plan-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Casa Harmonia"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="salary">Salario</Label>
          <Input
            id="salary"
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="33000"
            required
          />
        </div>
        <div>
          <Label htmlFor="monthly-cost">Custo mensal</Label>
          <Input
            id="monthly-cost"
            type="number"
            value={monthlyCost}
            onChange={(e) => setMonthlyCost(e.target.value)}
            placeholder="15000"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="monthly-investment">Investimento fixo mensal</Label>
        <Input
          id="monthly-investment"
          type="number"
          value={monthlyInvestment}
          onChange={(e) => setMonthlyInvestment(e.target.value)}
          placeholder="800 (opcional)"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Fundos (caixinhas)</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addFund}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {funds.map((fund, i) => (
            <div key={fund.fundId} className="flex gap-2 items-end">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{
                    background: FUND_COLORS[i % FUND_COLORS.length].fill,
                  }}
                />
                <Input
                  value={fund.label}
                  onChange={(e) => updateFund(i, "label", e.target.value)}
                  placeholder={`Fundo ${i + 1}`}
                />
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  value={fund.target}
                  onChange={(e) => updateFund(i, "target", e.target.value)}
                  placeholder="Meta"
                />
              </div>
              {funds.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFund(i)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            A ordem define a prioridade: o primeiro fundo enche antes do segundo
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Criando..." : "Criar plano"}
      </Button>
    </form>
  );
}

function PlanListItem({
  plan,
  onClick,
}: {
  plan: PlanDTO;
  onClick: () => void;
}) {
  const statusLabel =
    plan.status === "draft"
      ? "Rascunho"
      : plan.status === "active"
        ? "Ativo"
        : "Arquivado";
  const statusColor =
    plan.status === "active" ? FUND_COLORS[1] : FUND_COLORS[0];

  return (
    <div
      className="rounded-2xl border border-gray-100 bg-gray-50/30 p-4 cursor-pointer hover:border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {plan.name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                background: statusColor.bg,
                color: statusColor.text,
                border: `1px solid ${statusColor.border}`,
              }}
            >
              {statusLabel}
            </span>
            <span className="text-[11px] text-gray-400">
              {plan.fundAllocation.length} fundos
            </span>
          </div>
        </div>
        <div className="flex -space-x-1">
          {plan.fundAllocation
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 4)
            .map((f, i) => (
              <div
                key={f.fundId}
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{
                  background: FUND_COLORS[i % FUND_COLORS.length].fill,
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

export function PlanoTab() {
  const { plans, isLoading } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        Carregando...
      </div>
    );
  }

  if (selectedPlanId) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-gray-500 shrink-0"
          onClick={() => setSelectedPlanId(null)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <PlanDashboard planId={selectedPlanId} onDelete={() => setSelectedPlanId(null)} />
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-gray-500"
          onClick={() => setShowCreate(false)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-lg font-bold mb-4">Novo plano</h2>
        <CreatePlanForm
          onCreated={(id) => {
            setShowCreate(false);
            setSelectedPlanId(id);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pb-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Planos</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Novo plano
        </Button>
      </div>

      {!plans || plans.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <TrendingUpIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Nenhum plano criado ainda
          </p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>
            Criar primeiro plano
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <PlanListItem
              key={plan.id}
              plan={plan}
              onClick={() => setSelectedPlanId(plan.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
