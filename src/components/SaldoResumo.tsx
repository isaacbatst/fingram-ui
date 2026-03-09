type SaldoResumoProps = {
  saldo: number;
  receitas: number;
  despesas: number;
};

export function SaldoResumo({ saldo, receitas, despesas }: SaldoResumoProps) {
  return (
    <div className="text-center mb-3 sm:mt-3">
      <div className="uppercase text-xs tracking-widest font-semibold mb-1 text-muted-foreground font-display duna-stagger-1">
        Saldo
      </div>
      <div className="text-4xl font-extrabold font-mono drop-shadow-[0_0_12px_rgba(217,175,120,0.15)] mb-2 text-foreground duna-stagger-2">
        R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </div>
      <div className="flex justify-center mt-1 space-x-6 text-sm duna-stagger-3">
        <div className="flex items-center gap-1 font-medium font-mono text-[var(--color-success)]">
          <svg width="16" height="16" fill="none" className="inline">
            <path
              d="M8 2v12M8 2l4 4M8 2L4 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          + R$ {receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1 font-medium font-mono text-[var(--color-danger)]">
          <svg width="16" height="16" fill="none" className="inline">
            <path
              d="M8 14V2M8 14l4-4M8 14l-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          - R$ {despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground my-2">
        (receitas e despesas deste mês)
      </p>
    </div>
  );
}
