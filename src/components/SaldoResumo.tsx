type SaldoResumoProps = {
  saldo: number;
  receitas: number;
  despesas: number;
  despesasPlanejadas: number;
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export function SaldoResumo({ saldo, receitas, despesas, despesasPlanejadas }: SaldoResumoProps) {
  return (
    <div
      className="rounded-lg border border-[var(--color-accent-border)] p-4 sm:p-5 mb-4 sm:mt-3 duna-glass duna-stagger-1"
      style={{
        background:
          "linear-gradient(135deg, rgba(217,175,120,0.08) 0%, rgba(217,175,120,0.02) 100%)",
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="uppercase text-[11px] tracking-widest font-semibold text-muted-foreground font-display">
          Saldo total
        </span>
        <span className="text-[11px] text-muted-foreground font-mono">
          este mês
        </span>
      </div>

      <div
        className="text-2xl sm:text-4xl font-bold font-mono text-white mb-4 duna-stagger-2"
        style={{ textShadow: "0 0 24px rgba(255,255,255,0.08)" }}
      >
        R$ {fmt(saldo)}
      </div>

      <div className="flex gap-4 duna-stagger-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-success-bg)] border border-[var(--color-success-border)]">
          <svg width="12" height="12" fill="none" className="shrink-0">
            <path
              d="M6 1v10M6 1l3 3M6 1L3 4"
              stroke="var(--color-success)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm font-medium font-mono text-[var(--color-success)]">
            {fmt(receitas)}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)]">
          <svg width="12" height="12" fill="none" className="shrink-0">
            <path
              d="M6 11V1M6 11l3-3M6 11L3 8"
              stroke="var(--color-danger)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm font-medium font-mono text-[var(--color-danger)]">
            {fmt(despesas)}
          </span>
        </div>
        {despesasPlanejadas > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-info-bg)] border border-[var(--color-info-border)]">
            <span className="text-[11px] font-medium text-[var(--color-info)] uppercase tracking-wide">Plan</span>
            <span className="text-sm font-medium font-mono text-[var(--color-info)]">
              {fmt(despesasPlanejadas)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
