import { useRef, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, ChevronDown, FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "@/components/CategorySelect";
import { EstratoSelect } from "@/components/EstratoSelect";
import { MoneyInput } from "@/components/MoneyInput";
import { DatePicker } from "@/components/DatePicker";
import { useApi } from "@/hooks/useApi";
import { useCategories, type Category } from "@/hooks/useCategories";
import { useImportReview } from "@/hooks/useImportReview";
import { ImportTriagem } from "@/components/ImportTriagem";
import { cn } from "@/lib/utils";
import type { ImportBatchDTO, ImportEntryDTO } from "@/services/api.interface";
import { RotateCcw } from "lucide-react";

const PAGE_SIZE = 25;

/** Converte o arquivo em base64 sem passar por texto, preservando os bytes latin1. */
async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  // Em blocos: String.fromCharCode com o array inteiro estoura a pilha em arquivos grandes.
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

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

const formatPeriod = (batch: ImportBatchDTO) => {
  if (!batch.periodStart || !batch.periodEnd) return null;
  return `${formatDay(batch.periodStart)} – ${formatDay(batch.periodEnd)}`;
};

export function ImportExtrato() {
  const { apiService } = useApi();
  const { data: categories } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [batchId, setBatchId] = useState<string | null>(null);
  const [boxId, setBoxId] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"triagem" | "lista">("triagem");
  const [isUploading, setIsUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Imports com revisão pela metade. Sem esta lista o lote fica inalcançável:
  // reenviar o arquivo não recupera nada, porque a deduplicação recusa recriar
  // linhas já vistas.
  const { data: batchList, mutate: mutateBatches } = useSWR(
    "import-batches",
    () => apiService.getImportBatches(),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  const unfinished = (batchList?.batches ?? []).filter((b) => b.pendingCount > 0);

  const { review, isLoading, mutate } = useImportReview(batchId, {
    status: "pending",
    page,
    pageSize: PAGE_SIZE,
  });

  /** O saldo e os orçamentos mudam assim que um lançamento vira transação. */
  const refreshVault = () => {
    void globalMutate((key) => typeof key === "string" && key !== "boxes", undefined, {
      revalidate: true,
    });
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await apiService.uploadImport({
        contentBase64: await fileToBase64(file),
        fileName: file.name,
        boxId: boxId || undefined,
        // Data pura: o corte é por dia, sem hora nem fuso.
        fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
      });

      if (result.error || !result.batches?.length) {
        toast.error(result.error ?? "Nenhum extrato encontrado no arquivo");
        return;
      }

      setBatchId(result.batches[0].id);
      setPage(1);
      setView("triagem");
      if (result.batches.length > 1) {
        toast.info(
          `O arquivo tem ${result.batches.length} contas. Revisando a primeira; as demais ficam salvas.`,
        );
      }
    } catch {
      toast.error("Não foi possível ler o arquivo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmEntries = async (entryIds: string[]) => {
    const result = await apiService.confirmImportEntries(entryIds);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await mutate();
    refreshVault();
  };

  const handleConfirmAllPending = async () => {
    if (!batchId) return;
    setBusyId("batch");
    const result = await apiService.confirmImportBatch(batchId);
    setBusyId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await mutate();
    refreshVault();
  };

  const handleDismiss = async (entryId: string) => {
    setBusyId(entryId);
    const result = await apiService.dismissImportEntry(entryId);
    setBusyId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await mutate();
  };

  if (!batchId) {
    return (
      <section className="duna-surface rounded-lg p-4 flex flex-col gap-3">
        {unfinished.length > 0 && (
          <div className="flex flex-col gap-2 pb-3 border-b border-[var(--color-border)]">
            <p className="text-sm">Revisões em aberto</p>
            {unfinished.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setBatchId(item.id);
                  setPage(1);
                  setView("triagem");
                }}
                className="flex items-center justify-between gap-3 min-h-11 px-3 py-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {item.accountLabel ?? "Extrato"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatPeriod(item) ?? formatDay(item.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0 text-[var(--color-accent)]">
                  <span className="font-mono text-sm">{item.pendingCount}</span>
                  <RotateCcw className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        )}

        <div>
          {/* Sem título aqui: a aba do controle segmentado já diz "Importar". */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Envie o arquivo OFX do seu banco. Nada entra sem você confirmar, e reenviar o
            mesmo período não duplica lançamentos.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="import-estrato">Estrato da conta</Label>
          <EstratoSelect
            value={boxId}
            onChange={setBoxId}
            placeholder="Estrato padrão"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>A partir de</Label>
          <DatePicker
            date={fromDate}
            onDateChange={setFromDate}
            placeholder="Todo o extrato"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {fromDate
              ? "Lançamentos anteriores a essa data ficam de fora. Você pode trazê-los depois reenviando o arquivo sem data."
              : "Opcional. Sem data, o extrato inteiro é importado."}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".ofx,application/x-ofx,application/vnd.intu.qfx"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileUp className="w-4 h-4" />
          )}
          {isUploading ? "Lendo arquivo…" : "Escolher arquivo OFX"}
        </Button>
      </section>
    );
  }

  const batch = review?.batch;
  const pending = review?.counts.pending ?? 0;
  const entries = review?.entries.items ?? [];
  const totalPages = review?.entries.totalPages ?? 1;

  const finish = () => {
    // Fecha o lote só quando não sobrou nada a decidir. Com pendências ele
    // continua aberto de propósito, para reaparecer na lista de revisões em aberto.
    if (batchId && pending === 0) {
      void apiService.closeImportBatch(batchId);
    }
    setBatchId(null);
    setExpandedId(null);
    setFromDate(undefined);
    setView("triagem");
    void mutateBatches();
    refreshVault();
  };

  // A triagem é a tela padrão depois do upload: classificar um extrato linha a
  // linha é a unidade errada de trabalho. A lista continua acessível para conferir.
  if (view === "triagem") {
    return (
      <section className="duna-surface rounded-lg p-4 flex flex-col gap-2">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg truncate">
              {batch?.accountLabel ?? "Extrato"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {batch && formatPeriod(batch)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 shrink-0"
            onClick={finish}
          >
            Sair
          </Button>
        </header>

        <ImportTriagem
          batchId={batchId}
          accountBoxId={batch?.boxId ?? null}
          onSwitchToList={() => setView("lista")}
          onFinished={finish}
        />
      </section>
    );
  }

  return (
    <section className="duna-surface rounded-lg p-4 flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg truncate">
            {batch?.accountLabel ?? "Extrato"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {batch && formatPeriod(batch)}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {pending > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => setView("triagem")}
            >
              Triagem
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={finish}
          >
            Concluir
          </Button>
        </div>
      </header>

      <dl className="text-sm flex flex-col gap-1">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">A revisar</dt>
          <dd className="font-mono">{pending}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Confirmadas</dt>
          <dd className="font-mono">{review?.counts.confirmed ?? 0}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Ignoradas</dt>
          <dd className="font-mono">{review?.counts.dismissed ?? 0}</dd>
        </div>
        {!!review?.duplicateCount && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Já importadas antes</dt>
            <dd className="font-mono">{review.duplicateCount}</dd>
          </div>
        )}
        {!!review?.outOfRangeCount && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Antes de {batch?.fromDate ? formatDay(batch.fromDate) : "a data escolhida"}
            </dt>
            <dd className="font-mono">{review.outOfRangeCount}</dd>
          </div>
        )}
      </dl>

      {pending > 0 && (
        <Button
          type="button"
          disabled={busyId === "batch"}
          onClick={() => void handleConfirmAllPending()}
          className="min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
        >
          {busyId === "batch" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Confirmar todas as {pending}
        </Button>
      )}

      {isLoading && entries.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
      )}

      {!isLoading && pending === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center leading-relaxed">
          Nada mais a revisar neste extrato.
        </p>
      )}

      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            categories={categories ?? []}
            isBusy={busyId === entry.id}
            isExpanded={expandedId === entry.id}
            onToggle={() =>
              setExpandedId((current) => (current === entry.id ? null : entry.id))
            }
            onConfirm={async () => {
              setBusyId(entry.id);
              await confirmEntries([entry.id]);
              setBusyId(null);
            }}
            onDismiss={() => void handleDismiss(entry.id)}
            onSaved={async () => {
              setExpandedId(null);
              await mutate();
            }}
          />
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground font-mono">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </section>
  );
}

type EntryRowProps = {
  entry: ImportEntryDTO;
  categories: Category[];
  isBusy: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onConfirm: () => void | Promise<void>;
  onDismiss: () => void;
  onSaved: () => void | Promise<void>;
};

function EntryRow({
  entry,
  categories,
  isBusy,
  isExpanded,
  onToggle,
  onConfirm,
  onDismiss,
  onSaved,
}: EntryRowProps) {
  const { apiService } = useApi();
  const [description, setDescription] = useState(entry.description);
  const [amount, setAmount] = useState(entry.amount);
  const [date, setDate] = useState<Date | undefined>(() => {
    const [year, month, day] = entry.date.split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day);
  });
  const [categoryId, setCategoryId] = useState(entry.categoryId ?? "");
  const [boxId, setBoxId] = useState(entry.boxId ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const isExpense = entry.type === "expense";
  // O texto do banco só é mostrado quando difere: serve para conferir contra o extrato.
  const showRaw = entry.rawDescription && entry.rawDescription !== entry.description;

  const handleSave = async () => {
    setIsSaving(true);
    const result = await apiService.editImportEntry({
      entryId: entry.id,
      description,
      amount,
      // Enviado como data pura: o servidor guarda o dia, sem hora nem fuso.
      date: date ? format(date, "yyyy-MM-dd") : undefined,
      categoryId: categoryId || null,
      boxId: boxId || null,
    });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    await onSaved();
  };

  return (
    <li className="py-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 min-w-0 flex items-center gap-3 text-left min-h-11"
          aria-expanded={isExpanded}
        >
          <span className="text-xs text-muted-foreground font-mono w-14 shrink-0">
            {formatDay(entry.date)}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block truncate text-sm">{entry.description || "—"}</span>
            {showRaw && (
              <span className="block truncate text-xs text-muted-foreground">
                {entry.rawDescription}
              </span>
            )}
          </span>
          <span
            className={cn(
              "font-mono text-sm shrink-0",
              isExpense ? "text-[var(--color-danger)]" : "text-[var(--color-success)]",
            )}
          >
            {isExpense ? "−" : "+"}
            {formatMoney(entry.amount)}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Ignorar lançamento"
            className="min-h-11 min-w-11"
            disabled={isBusy}
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            aria-label="Confirmar lançamento"
            className="min-h-11 min-w-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
            disabled={isBusy}
            onClick={() => void onConfirm()}
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 pt-3 pb-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`desc-${entry.id}`}>Descrição</Label>
            <Input
              id={`desc-${entry.id}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`amount-${entry.id}`}>Valor</Label>
              <MoneyInput id={`amount-${entry.id}`} value={amount} onChange={setAmount} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data</Label>
              <DatePicker date={date} onDateChange={setDate} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <CategorySelect
              categories={categories.map((category) => ({
                label: category.name,
                value: category.id,
                type: category.transactionType,
              }))}
              value={categoryId || undefined}
              onChange={setCategoryId}
              currentTransactionType={entry.type}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Estrato</Label>
            <EstratoSelect value={boxId} onChange={setBoxId} />
          </div>

          <Button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSave()}
            className="min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Salvar
          </Button>
        </div>
      )}
    </li>
  );
}
