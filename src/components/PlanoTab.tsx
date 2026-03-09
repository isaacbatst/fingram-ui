import { TrendingUp } from "lucide-react";

export function PlanoTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <TrendingUp className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="font-display text-xl font-semibold text-foreground mb-3 tracking-tight">
        Plano em construção
      </h2>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
        Quando estiver pronto, o Duna acompanha com você.
      </p>
    </div>
  );
}
