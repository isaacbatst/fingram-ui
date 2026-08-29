import { useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ChevronLeft, Loader2, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { useCategories, type Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import type { ImportGroupDTO } from "@/services/api.interface";

type Props = {
  batchId: string;
  onSwitchToList: () => void;
  onFinished: () => void;
};

const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDay = (iso: string) => {
  const [year, month, day] = iso.split("T")[0].split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monthLabel = date.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
  return `${String(day).padStart(2, "0")} ${monthLabel}`;
};

/**
 * Triagem: um estabelecimento por vez, categorias como toque único.
 *
 * Categorizar aqui não confirma nada — os lançamentos seguem pendentes até o
 * confirmar final. É isso que deixa voltar e mudar de ideia sair de graça.
 */
export function ImportTriagem({ batchId, onSwitchToList, onFinished }: Props) {
  const { apiService } = useApi();
  const { data: categories } = useCategories();

  const { data, isLoading } = useSWR(
    ["import-groups", batchId],
    () => apiService.getImportGroups(batchId),
    { revalidateOnFocus: false },
  );

  const groups = useMemo(() => data?.groups ?? [], [data]);
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, string | null>>({});
  const [ignored, setIgnored] = useState<Record<string, true>>({});
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const group: ImportGroupDTO | undefined = groups[index];

  const options = useMemo(
    () =>
      (categories ?? []).filter(
        (category: Category) =>
          category.transactionType === group?.type ||
          category.transactionType === "both",
      ),
    [categories, group?.type],
  );

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">Carregando…</p>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-3 py-8 text-center">
        <p className="text-sm text-muted-foreground">Nada pendente neste extrato.</p>
        <Button type="button" variant="ghost" className="min-h-11" onClick={onFinished}>
          Concluir
        </Button>
      </div>
    );
  }

  // Passou do último grupo: hora de confirmar o que foi decidido.
  if (!group) {
    const decided = Object.keys(decisions).length;
    const skipped = groups.length - decided - Object.keys(ignored).length;
    const pendingLines = groups
      .filter((g) => !ignored[g.key])
      .reduce((sum, g) => sum + g.count, 0);

    const handleConfirmAll = async () => {
      setIsConfirming(true);
      const result = await apiService.confirmImportBatch(batchId);
      setIsConfirming(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onFinished();
    };

    return (
      <div className="flex flex-col gap-4 py-6">
        <div className="text-center">
          <p className="font-display text-lg">Tudo revisado</p>
        </div>

        <dl className="text-sm flex flex-col gap-1">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Estabelecimentos categorizados</dt>
            <dd className="font-mono">{decided}</dd>
          </div>
          {skipped > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pulados, sem categoria</dt>
              <dd className="font-mono">{skipped}</dd>
            </div>
          )}
          {Object.keys(ignored).length > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ignorados</dt>
              <dd className="font-mono">{Object.keys(ignored).length}</dd>
            </div>
          )}
        </dl>

        <Button
          type="button"
          disabled={isConfirming}
          onClick={() => void handleConfirmAll()}
          className="min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
        >
          {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirmar {pendingLines} lançamentos
        </Button>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => setIndex(groups.length - 1)}
          >
            Voltar
          </Button>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onSwitchToList}>
            Rever lista
          </Button>
        </div>
      </div>
    );
  }

  const chosen = decisions[group.key];

  const handleChoose = async (categoryId: string) => {
    setIsBusy(true);
    const result = await apiService.categorizeImportEntries(group.entryIds, categoryId);
    setIsBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setDecisions((current) => ({ ...current, [group.key]: categoryId }));
    setIndex((current) => current + 1);
  };

  const handleIgnore = async () => {
    setIsBusy(true);
    const results = await Promise.all(
      group.entryIds.map((entryId) => apiService.dismissImportEntry(entryId)),
    );
    setIsBusy(false);
    const failed = results.find((r) => r.error);
    if (failed) {
      toast.error(failed.error!);
      return;
    }
    setIgnored((current) => ({ ...current, [group.key]: true }));
    setIndex((current) => current + 1);
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11"
          disabled={index === 0}
          onClick={() => setIndex((current) => current - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Button>
        <span className="text-xs text-muted-foreground font-mono">
          {index + 1} de {groups.length}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11"
          onClick={() => setIndex((current) => current + 1)}
        >
          Pular
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-center flex flex-col gap-1 py-2">
        <p className="text-base break-words px-2">{group.description || "—"}</p>
        <p
          className={cn(
            "font-mono text-2xl",
            group.type === "expense"
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-success)]",
          )}
        >
          {formatMoney(group.totalAmount)}
        </p>
        <p className="text-xs text-muted-foreground">
          {group.count === 1
            ? formatDay(group.firstDate)
            : `${group.count} lançamentos · ${formatDay(group.firstDate)} – ${formatDay(group.lastDate)}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {options.map((category) => (
          <button
            key={category.id}
            type="button"
            disabled={isBusy}
            onClick={() => void handleChoose(category.id)}
            className={cn(
              "min-h-11 px-3 py-2 rounded-md text-sm text-left truncate border transition-colors",
              chosen === category.id
                ? "bg-[var(--color-accent-bg)] text-[var(--color-accent)] border-[var(--color-accent-border)]"
                : "border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)]",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 text-muted-foreground"
          disabled={isBusy}
          onClick={() => void handleIgnore()}
        >
          <X className="w-4 h-4" />
          Ignorar
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" onClick={onSwitchToList}>
          Ver lista
        </Button>
      </div>
    </div>
  );
}
