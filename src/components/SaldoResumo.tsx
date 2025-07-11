import { useTheme } from "@/hooks/useTheme";

type SaldoResumoProps = {
  saldo: number;
  receitas: number;
  despesas: number;
};

export function SaldoResumo({ saldo, receitas, despesas }: SaldoResumoProps) {
  const { getThemeColor } = useTheme();
  
  return (
    <div className="text-center mb-6">
      <div
        className="uppercase text-xs tracking-widest font-semibold mb-1"
        style={{ color: getThemeColor("hint_color") }}
      >
        Saldo
      </div>
      <div
        className="text-4xl font-extrabold drop-shadow-sm mb-2"
        style={{ color: getThemeColor("accent_text_color") }}
      >
        R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </div>
      <div className="flex justify-center mt-1 space-x-6 text-sm">
        <div
          className="flex items-center gap-1 font-medium"
          style={{ color: getThemeColor("link_color") }}
        >
          <svg width="16" height="16" fill="none" className="inline">
            <path
              d="M8 2v12M8 2l4 4M8 2L4 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          + R${" "}
          {receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
        <div
          className="flex items-center gap-1 font-medium"
          style={{ color: getThemeColor("destructive_text_color") }}
        >
          <svg width="16" height="16" fill="none" className="inline">
            <path
              d="M8 14V2M8 14l4-4M8 14l-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          - R${" "}
          {despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
