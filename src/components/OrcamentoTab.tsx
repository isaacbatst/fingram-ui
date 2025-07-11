import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/hooks/useTheme";

type OrcamentoItem = {
  categoria: string;
  valor: number;
  usado: number;
};

type OrcamentoProps = {
  orcamento: OrcamentoItem[];
};

export function OrcamentoTab({ orcamento }: OrcamentoProps) {
  const { getThemeColor } = useTheme();
  return (
    <div>
      <div className="mb-2 font-semibold text-gray-700 text-base">
        Orçamento por categoria
      </div>
      <div className="space-y-4">
        {orcamento.map((c) => {
          const pct = Math.min(100, (c.usado / c.valor) * 100);
          
          // Cores para a barra de progresso
          const filledColor = pct > 90
            ? getThemeColor("destructive_text_color")
            : getThemeColor("accent_text_color");
          
          const bgColor = getThemeColor("section_separator_color");
          
          return (
            <div key={c.categoria}>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-600">
                  {c.categoria}
                </span>
                <span className="text-xs text-gray-400">
                  R$ {c.usado}/{c.valor}
                </span>
              </div>
              <Progress
                value={pct}
                filledColor={filledColor}
                bgColor={bgColor}
                className="h-4"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
