import { useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ArrowLeftRight, CalendarClock, ChevronLeft, Loader2, PiggyBank, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { useBoxes } from "@/hooks/useBoxes";
import { usePaymentAllocations } from "@/hooks/usePaymentAllocations";
import { useAllocations } from "@/hooks/useAllocations";
import { useCategories, type Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import type { ImportGroupDTO } from "@/services/api.interface";
import { InvoicePaymentTriage } from "@/components/cartoes/InvoicePaymentTriage";
import { refreshAfterCardChange } from "@/hooks/useCards";
import type { InvoicePaymentTarget } from "@/lib/invoice";

type Props = {
  batchId: string;
  /** Estrato da conta do extrato — origem (ou destino) do par de transferência. */
  accountBoxId: string | null;
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
export function ImportTriagem({
  batchId,
  accountBoxId,
  onSwitchToList,
  onFinished,
}: Props) {
  const { apiService } = useApi();
  const { data: categories } = useCategories();
  const { boxes } = useBoxes();

  const { data, error, isLoading, mutate } = useSWR(
    ["import-groups", batchId],
    () => apiService.getImportGroups(batchId),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  const groups = useMemo(() => data?.groups ?? [], [data]);
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, string | null>>({});
  const [ignored, setIgnored] = useState<Record<string, true>>({});
  // Transferência e uso de Reserva confirmam na hora: não voltam ao confirmar final.
  const [confirmedNow, setConfirmedNow] = useState<Record<string, true>>({});
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [choosingTransfer, setChoosingTransfer] = useState(false);
  const [choosingPlanned, setChoosingPlanned] = useState(false);
  const { allocations: paymentAllocations } = usePaymentAllocations();
  const { allocations: allAllocations } = useAllocations();
  const reserveAllocations = useMemo(
    () => allAllocations.filter((a) => a.realizationMode !== "immediate"),
    [allAllocations],
  );
  // Uso de Reserva: escolhe a Reserva, depois realização ou saque.
  const [choosingReserve, setChoosingReserve] = useState(false);
  const [reserveId, setReserveId] = useState<string | null>(null);
  const [withdrawalType, setWithdrawalType] = useState<"realization" | "withdrawal">(
    "realization",
  );
  const [fromEstrato, setFromEstrato] = useState(true);
  // Sugestão, nunca imposição: o usuário pode dizer que aquela linha é gasto real.
  const [overrideSettlement, setOverrideSettlement] = useState(false);

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

  // Falha de rede ou endpoint ausente não pode ser apresentada como extrato vazio:
  // é a diferença entre "não há nada a fazer" e "não consegui perguntar".
  if (error) {
    return (
      <div className="flex flex-col gap-3 py-8 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed px-4">
          Não foi possível carregar a triagem.
          {error instanceof Error && error.message ? ` ${error.message}` : ""}
        </p>
        <p className="text-xs text-muted-foreground px-4">
          Os lançamentos continuam salvos — abra a lista para revisá-los.
        </p>
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => void mutate()}
          >
            Tentar de novo
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={onSwitchToList}
          >
            Ver lista
          </Button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-3 py-8 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed px-4">
          Nenhum lançamento novo para revisar. Se você já tinha importado este
          extrato, os lançamentos dele foram reconhecidos e não entram de novo.
        </p>
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={onSwitchToList}
          >
            Ver lista
          </Button>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onFinished}>
            Concluir
          </Button>
        </div>
      </div>
    );
  }

  // Passou do último grupo: hora de confirmar o que foi decidido.
  if (!group) {
    const settled = (key: string) => ignored[key] || confirmedNow[key];
    const decided = Object.keys(decisions).filter((key) => !settled(key)).length;
    const confirmedCount = Object.keys(confirmedNow).length;
    const skipped =
      groups.length - decided - Object.keys(ignored).length - confirmedCount;
    const pendingLines = groups
      .filter((g) => !settled(g.key))
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
          {confirmedCount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Confirmados na hora</dt>
              <dd className="font-mono">{confirmedCount}</dd>
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
          onClick={() => (pendingLines > 0 ? void handleConfirmAll() : onFinished())}
          className="min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
        >
          {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
          {pendingLines > 0
            ? `Confirmar ${pendingLines} ${pendingLines === 1 ? "lançamento" : "lançamentos"}`
            : "Concluir"}
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

  /** Avança limpando o que era escolha daquele grupo, não da tela. */
  const goTo = (next: number) => {
    setChoosingTransfer(false);
    setChoosingPlanned(false);
    setChoosingReserve(false);
    setReserveId(null);
    setOverrideSettlement(false);
    setIndex(next);
  };
  const goToNext = () => goTo(index + 1);

  const handleChoose = async (categoryId: string) => {
    setIsBusy(true);
    const result = await apiService.categorizeImportEntries(group.entryIds, categoryId);
    setIsBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setDecisions((current) => ({ ...current, [group.key]: categoryId }));
    goToNext();
  };

  /**
   * Liga o grupo a uma alocação de Pagamento do plano (financiamento, parcela).
   * Como a categoria, não confirma: só decide para onde o gasto conta — o plano,
   * não o orçamento do dia a dia.
   */
  const handlePlanned = async (allocationId: string) => {
    setIsBusy(true);
    const result = await apiService.categorizeImportEntries(
      group.entryIds,
      null,
      allocationId,
    );
    setIsBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setDecisions((current) => ({ ...current, [group.key]: `plano:${allocationId}` }));
    goToNext();
  };

  /**
   * Confirma o grupo como transferência entre estratos, criando o par.
   *
   * Diferente das categorias, isto confirma na hora: não existe "transferência
   * pendente" no modelo — o par ou existe ou não existe.
   */
  const handleTransfer = async (boxId: string) => {
    setIsBusy(true);
    const result = await apiService.confirmImportTransfer(group.entryIds, boxId);
    setIsBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setConfirmedNow((current) => ({ ...current, [group.key]: true }));
    goToNext();
  };

  /**
   * Confirma o grupo como despesa paga com dinheiro de uma Reserva. Como a
   * transferência, confirma na hora: lança a despesa vinculada a ela, com o
   * tipo de saída, no estrato da Reserva (ou na conta, se o dinheiro já tinha
   * sido transferido para lá).
   */
  const handleReserve = async () => {
    const reserve = reserveAllocations.find((a) => a.id === reserveId);
    if (!reserve) return;
    setIsBusy(true);
    const result = await apiService.confirmImportReserveWithdrawal(
      group.entryIds,
      reserve.id,
      reserve.realizationMode === "never" ? "withdrawal" : withdrawalType,
      reserve.estratoId !== null && fromEstrato,
    );
    setIsBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.skipped?.length) {
      toast.error(
        `${result.skipped.length} lançamento(s) não puderam ser confirmados.`,
      );
    }
    setConfirmedNow((current) => ({ ...current, [group.key]: true }));
    goToNext();
  };

  /**
   * Confirma o débito como pagamento de fatura, na hora. Não vira gasto: faz
   * contar as compras que paga, na data dele; o que ele pagar além das
   * compras conhecidas fica "não discriminado" até o extrato do cartão.
   */
  const handleInvoicePayment = async (target: InvoicePaymentTarget) => {
    setIsBusy(true);
    const result = await apiService.confirmImportInvoicePayment(group.entryIds, target);
    setIsBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.skipped?.length) {
      toast.error(
        `${result.skipped.length} lançamento(s) não puderam ser confirmados.`,
      );
    }
    // Pode ter criado cartão e fatura: cartões, faturas e saldos mudam.
    void refreshAfterCardChange();
    setConfirmedNow((current) => ({ ...current, [group.key]: true }));
    goToNext();
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
    goToNext();
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
          onClick={() => goTo(index - 1)}
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
          onClick={goToNext}
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

      {group.suggestsInvoice && !choosingTransfer && !overrideSettlement ? (
        /* Débito de pagamento de fatura na conta corrente: vira pagamento do
           cartão (não gasto). Ignorá-lo deixaria as compras do cartão sem
           nunca contar. */
        <InvoicePaymentTriage
          key={group.key}
          group={group}
          isBusy={isBusy}
          onConfirm={(target) => void handleInvoicePayment(target)}
          onNotPayment={() => setOverrideSettlement(true)}
        />
      ) : group.looksLikeSettlement && !choosingTransfer && !overrideSettlement ? (
        /* Quitação vista do cartão ("Pagamento recebido"). Não é receita: o
           pagamento entra pela conta corrente. */
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground leading-relaxed text-center px-2">
            Isto parece a quitação de uma fatura, não um gasto nem uma receita
            nova. O pagamento entra pelo extrato da conta corrente.
          </p>
          <Button
            type="button"
            disabled={isBusy}
            onClick={() => void handleIgnore()}
            className="min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Ignorar esta linha
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => setOverrideSettlement(true)}
          >
            {group.type === "income" ? "É uma receita normal" : "É um gasto normal"}
          </Button>
        </div>
      ) : choosingPlanned ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
            Qual pagamento do plano é este?
          </p>
          <div className="grid grid-cols-1 gap-2">
            {paymentAllocations.map((allocation) => (
              <button
                key={allocation.id}
                type="button"
                disabled={isBusy}
                onClick={() => void handlePlanned(allocation.id)}
                className={cn(
                  "min-h-11 px-3 py-2 rounded-md text-sm text-left truncate border transition-colors",
                  chosen === `plano:${allocation.id}`
                    ? "bg-[var(--color-accent-bg)] text-[var(--color-accent)] border-[var(--color-accent-border)]"
                    : "border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)]",
                )}
              >
                {allocation.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => setChoosingPlanned(false)}
          >
            Cancelar
          </Button>
        </div>
      ) : choosingReserve ? (
        <ReserveChooser
          reserves={reserveAllocations}
          estratoName={(id) => boxes?.find((b) => b.id === id)?.name ?? null}
          reserveId={reserveId}
          onSelectReserve={(id) => {
            setReserveId(id);
            setWithdrawalType("realization");
            setFromEstrato(true);
          }}
          withdrawalType={withdrawalType}
          onWithdrawalType={setWithdrawalType}
          fromEstrato={fromEstrato}
          onFromEstrato={setFromEstrato}
          isBusy={isBusy}
          onConfirm={() => void handleReserve()}
          onCancel={() => {
            setChoosingReserve(false);
            setReserveId(null);
          }}
        />
      ) : choosingTransfer ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
            {group.type === "expense"
              ? "Para qual estrato esse dinheiro foi?"
              : "De qual estrato esse dinheiro veio?"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(boxes ?? [])
              // A conta de origem não pode ser o outro lado dela mesma.
              .filter((estrato) => estrato.id !== accountBoxId)
              .map((estrato) => (
                <button
                  key={estrato.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleTransfer(estrato.id)}
                  className="min-h-11 px-3 py-2 rounded-md text-sm text-left truncate border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] transition-colors"
                >
                  {estrato.name}
                </button>
              ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => setChoosingTransfer(false)}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <>
          {/* Sugestão: valor e mês batem com uma parcela prevista no plano. É o
              caso comum de financiamento — vira um toque de confirmação. */}
          {group.type === "expense" && group.suggestedAllocation && (
            <div className="flex flex-col gap-2 rounded-md border border-[var(--color-accent-border)] bg-[var(--color-accent-bg)] p-3">
              <p className="text-sm leading-relaxed">
                Parece a parcela de{" "}
                <span className="text-[var(--color-accent)]">
                  {group.suggestedAllocation.label}
                </span>
                , prevista no seu plano.
              </p>
              <Button
                type="button"
                disabled={isBusy}
                onClick={() => void handlePlanned(group.suggestedAllocation!.allocationId)}
                className="min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
              >
                <CalendarClock className="w-4 h-4" />
                Lançar como pagamento planejado
              </Button>
            </div>
          )}

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

          {/* Dinheiro que continua seu não é despesa: vira par entre estratos e
              não consome orçamento. */}
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full border border-dashed border-[var(--color-border)]"
            disabled={isBusy}
            onClick={() => setChoosingTransfer(true)}
          >
            <ArrowLeftRight className="w-4 h-4" />
            É transferência entre meus estratos
          </Button>

          {/* Parcela, financiamento: conta para o plano, não para o dia a dia. */}
          {group.type === "expense" && paymentAllocations.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full border border-dashed border-[var(--color-border)]"
              disabled={isBusy}
              onClick={() => setChoosingPlanned(true)}
            >
              <CalendarClock className="w-4 h-4" />
              É pagamento planejado
            </Button>
          )}

          {/* Gasto pago com o dinheiro guardado numa Reserva: sai do estrato
              dela, e o plano registra a realização (ou o saque). */}
          {group.type === "expense" && reserveAllocations.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full border border-dashed border-[var(--color-border)]"
              disabled={isBusy}
              onClick={() => setChoosingReserve(true)}
            >
              <PiggyBank className="w-4 h-4" />
              É uso de uma Reserva
            </Button>
          )}
        </>
      )}

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

type ReserveOption = {
  id: string;
  label: string;
  realizationMode: "immediate" | "manual" | "onCompletion" | "never";
  estratoId: string | null;
};

function ReserveChooser({
  reserves,
  estratoName,
  reserveId,
  onSelectReserve,
  withdrawalType,
  onWithdrawalType,
  fromEstrato,
  onFromEstrato,
  isBusy,
  onConfirm,
  onCancel,
}: {
  reserves: ReserveOption[];
  estratoName: (id: string) => string | null;
  reserveId: string | null;
  onSelectReserve: (id: string) => void;
  withdrawalType: "realization" | "withdrawal";
  onWithdrawalType: (type: "realization" | "withdrawal") => void;
  fromEstrato: boolean;
  onFromEstrato: (value: boolean) => void;
  isBusy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const reserve = reserves.find((r) => r.id === reserveId);
  const canRealize = reserve?.realizationMode !== "never";
  const linkedName = reserve?.estratoId ? estratoName(reserve.estratoId) : null;

  const optionClass = (active: boolean) =>
    cn(
      "min-h-11 px-3 py-2 rounded-md text-sm text-left border transition-colors",
      active
        ? "bg-[var(--color-accent-bg)] text-[var(--color-accent)] border-[var(--color-accent-border)]"
        : "border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)]",
    );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
        De qual Reserva saiu esse dinheiro?
      </p>
      <div className="grid grid-cols-1 gap-2">
        {reserves.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={isBusy}
            onClick={() => onSelectReserve(r.id)}
            className={cn(optionClass(r.id === reserveId), "truncate")}
          >
            {r.label}
          </button>
        ))}
      </div>

      {reserve && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {canRealize && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onWithdrawalType("realization")}
                className={optionClass(withdrawalType === "realization")}
              >
                Realização
                <span className="block text-xs text-muted-foreground">
                  o gasto para o qual guardou
                </span>
              </button>
            )}
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onWithdrawalType("withdrawal")}
              className={optionClass(!canRealize || withdrawalType === "withdrawal")}
            >
              Saque
              <span className="block text-xs text-muted-foreground">
                uso fora do objetivo
              </span>
            </button>
          </div>

          {linkedName ? (
            <label className="flex items-start gap-2.5 text-sm leading-relaxed px-1 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                checked={fromEstrato}
                disabled={isBusy}
                onChange={(e) => onFromEstrato(e.target.checked)}
              />
              <span>
                Tirar o valor do estrato{" "}
                <span className="text-[var(--color-accent)]">{linkedName}</span>
                <span className="block text-xs text-muted-foreground">
                  Desmarque se você já transferiu esse dinheiro para a conta antes.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed px-1">
              Esta Reserva não está vinculada a um estrato: a despesa fica na
              conta, e o plano registra o uso da Reserva.
            </p>
          )}

          <Button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirmar
          </Button>
        </>
      )}

      <Button type="button" variant="ghost" className="min-h-11" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}
