import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useApi } from "@/hooks/useApi";
import { useCardNav } from "@/hooks/useCardNav";
import { refreshAfterCardChange, useDuplicates } from "@/hooks/useCards";
import { formatBRL, formatDayMonth } from "@/lib/invoice";
import type { DuplicatePair, DuplicateRef } from "@/services/api.interface";
import { ScreenHeader } from "./shared";

function Side({ label, item }: { label: string; item: DuplicateRef }) {
  return (
    <div className="flex-1 min-w-0 rounded-lg border border-[var(--color-border)] p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-sm text-foreground truncate">{item.description || "(Sem descrição)"}</div>
      <div className="text-xs text-muted-foreground font-mono">
        {formatDayMonth(item.date)} · {formatBRL(item.amount)}
      </div>
    </div>
  );
}

function PairCard({ pair }: { pair: DuplicatePair }) {
  const { apiService } = useApi();
  const [busy, setBusy] = useState<"manual" | "imported" | "dismiss" | null>(null);
  const [confirm, setConfirm] = useState<"manual" | "imported" | null>(null);

  const remove = async (which: "manual" | "imported") => {
    setBusy(which);
    const id = which === "manual" ? pair.manual.transactionId : pair.imported.transactionId;
    const result = await apiService.deleteTransaction(id);
    setBusy(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
  };

  /** Não é a mesma compra: nada é apagado, o par só deixa de ser sugerido. */
  const dismiss = async () => {
    setBusy("dismiss");
    const result = await apiService.dismissDuplicate({
      manualTransactionId: pair.manual.transactionId,
      importedTransactionId: pair.imported.transactionId,
    });
    setBusy(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
  };

  return (
    <div className="rounded-xl border border-border p-3 duna-surface space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Side label="Lançada à mão" item={pair.manual} />
        <Side label="Do extrato do cartão" item={pair.imported} />
      </div>
      <p className="text-xs text-muted-foreground">
        {pair.confidence === "high" ? "Mesmo valor e descrição parecida" : "Mesmo valor"}
        {pair.dayDistance === 0
          ? ", no mesmo dia."
          : `, ${pair.dayDistance} ${pair.dayDistance === 1 ? "dia" : "dias"} de diferença.`}
      </p>
      {confirm ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground">
            {confirm === "manual"
              ? "Excluir a transação lançada à mão?"
              : "Excluir a compra que veio do extrato?"}{" "}
            <span className="text-muted-foreground">Não dá para desfazer.</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 min-h-11"
              disabled={busy !== null}
              onClick={() => setConfirm(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 min-h-11"
              disabled={busy !== null}
              onClick={() => void remove(confirm)}
            >
              {busy && <Loader2 className="animate-spin" />}
              Excluir
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1 min-h-11" onClick={() => setConfirm("manual")}>
            Excluir a lançada à mão
          </Button>
          <Button
            variant="ghost"
            className="flex-1 min-h-11 text-muted-foreground"
            onClick={() => setConfirm("imported")}
          >
            Excluir a do extrato
          </Button>
          <Button
            variant="ghost"
            className="flex-1 min-h-11 text-muted-foreground"
            disabled={busy !== null}
            onClick={() => void dismiss()}
          >
            {busy === "dismiss" && <Loader2 className="animate-spin" />}
            Não é a mesma compra
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Transação lançada à mão que parece a mesma compra importada do extrato do
 * cartão. Mantidas as duas, o gasto conta duas vezes.
 */
export function DuplicatesView() {
  const nav = useCardNav();
  const { pairs, isLoading, error, mutate } = useDuplicates();

  return (
    <div className="flex flex-col pb-6">
      <ScreenHeader
        backLabel="Estratos"
        onBack={nav.backToEstratos}
        title="Possíveis duplicatas"
        subtitle="Mantidas as duas, o gasto conta duas vezes. Normalmente fica a do extrato. Se forem compras diferentes, marque que não é a mesma compra."
      />
      {isLoading && pairs.length === 0 ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorDisplay error="Erro ao carregar duplicatas" onRetry={mutate} className="my-4" />
      ) : pairs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma duplicata suspeita.</p>
      ) : (
        <div className="space-y-3">
          {pairs.map((pair) => (
            <PairCard key={`${pair.manual.transactionId}:${pair.imported.transactionId}`} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
}
