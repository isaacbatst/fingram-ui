import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoneyInput } from "@/components/MoneyInput";
import { CategorySelect } from "@/components/CategorySelect";
import { DatePicker } from "@/components/DatePicker";
import { useTransactions } from "@/hooks/useTransactions";
import { useBoxes } from "@/hooks/useBoxes";
import { useBudgetStartDay } from "@/hooks/useBudgetStartDay";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useApi } from "@/hooks/useApi";
import { useTransfer } from "@/hooks/useTransfer";
import { getCurrentBudgetPeriod } from "@/lib/utils";
import { ErrorDisplay } from "./ErrorDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { mutate } from "swr";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import type { Category } from "@/hooks/useCategories";

export type Transaction = {
  id: string;
  code: string;
  type: "income" | "expense";
  amount: number;
  category:
    | string
    | {
        id: string;
        name: string;
        code: string;
        description?: string;
      };
  categoryCode?: string;
  description: string;
  createdAt: string;
  date: string;
  boxId?: string;
  transferId?: string | null;
  transferToBoxId?: string;
};

type TransacoesTabProps = {
  categories: Category[];
  mutateSummary: () => void;
};

const parseDateLocal = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayStr = day.toString().padStart(2, "0");
  const monthStr = date
    .toLocaleString("pt-BR", { month: "short" })
    .replace(".", "");
  return `${dayStr} ${monthStr} ${year}`;
};

export function TransacoesTab({
  categories,
  mutateSummary,
}: TransacoesTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { budgetStartDay } = useBudgetStartDay();
  const { apiService, isAuthenticated } = useApi();
  const { editTransfer, deleteTransfer } = useTransfer();
  const { boxes } = useBoxes();
  const defaultPeriod = getCurrentBudgetPeriod(budgetStartDay);

  // URL filter state
  const currentPage = parseInt(
    searchParams.get("transacoes_pagina") || "1",
    10,
  );
  const setCurrentPage = (page: number) => {
    setSearchParams({ transacoes_pagina: page.toString() });
  };

  const filtroMes = parseInt(
    searchParams.get("transacoes_mes") || defaultPeriod.month.toString(),
    10,
  );
  const setFiltroMes = (month: number) => {
    setSearchParams({ transacoes_mes: month.toString() });
  };
  const filtroAno = parseInt(
    searchParams.get("transacoes_ano") || defaultPeriod.year.toString(),
    10,
  );
  const setFiltroAno = (year: number) => {
    setSearchParams({ transacoes_ano: year.toString() });
  };
  const filtroCategoria = searchParams.get("transacoes_categoria") || "";
  const setFiltroCategoria = (category: string) => {
    setSearchParams({ transacoes_categoria: category });
  };
  const filtroDescricao = searchParams.get("transacoes_descricao") || "";
  const setFiltroDescricao = (description: string) => {
    setSearchParams({ transacoes_descricao: description });
  };
  const filtroCaixinha = searchParams.get("transacoes_carteira") || "";
  const setFiltroCaixinha = (boxId: string) => {
    setSearchParams({ transacoes_carteira: boxId });
  };

  // Local UI state
  const [showSearch, setShowSearch] = useState(filtroDescricao !== "");
  const [searchInput, setSearchInput] = useState(filtroDescricao);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Edit form state
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editAmount, setEditAmount] = useState(0);
  const [editCategoryCode, setEditCategoryCode] = useState("");
  const [editBoxId, setEditBoxId] = useState("");
  const [editDate, setEditDate] = useState<string | undefined>(undefined);
  const [editDescription, setEditDescription] = useState("");
  // Transfer-specific edit state
  const [editFromBoxId, setEditFromBoxId] = useState("");
  const [editToBoxId, setEditToBoxId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch transactions
  const {
    data,
    isLoading,
    error,
    mutate: mutateTransactions,
  } = useTransactions({
    page: currentPage,
    month: filtroMes,
    year: filtroAno,
    categoryId: filtroCategoria,
    description: filtroDescricao,
    boxId: filtroCaixinha || undefined,
  });

  const transactions: Transaction[] = data?.items
    ? data.items.map((tx) => ({
        id: tx.id,
        code: tx.code,
        type: tx.type,
        amount: Math.abs(tx.amount),
        category: tx.category || "",
        categoryCode: tx.category?.code || "",
        description: tx.description || "",
        date: tx.date.toString(),
        createdAt: tx.createdAt.toString(),
        boxId: tx.boxId,
        transferId: tx.transferId,
        transferToBoxId: tx.transferToBoxId ?? undefined,
      }))
    : [];

  // Group transactions by date
  const groupedByDate = transactions.reduce<Record<string, Transaction[]>>(
    (groups, tx) => {
      const dateKey = tx.date.split("T")[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
      return groups;
    },
    {},
  );
  const dateKeys = Object.keys(groupedByDate).sort((a, b) =>
    b.localeCompare(a),
  );

  // Filter chip helpers
  const selectedCategoryName = categories.find(
    (c) => c.id === filtroCategoria,
  )?.name;
  const selectedBoxName = boxes?.find((b) => b.id === filtroCaixinha)?.name;

  const monthLabel = (() => {
    const monthName = new Date(2000, filtroMes - 1, 1).toLocaleString(
      "pt-BR",
      { month: "short" },
    );
    return `${monthName} ${filtroAno}`;
  })();

  // Invalidation after edit/delete
  const invalidateAll = async () => {
    await Promise.allSettled([
      mutateTransactions(),
      mutateSummary(),
      mutate("boxes"),
    ]);
    mutate((key: unknown) =>
      typeof key === "string" ? key.startsWith("budget-summary") : false,
    );
  };

  // Helpers for selected transaction
  const isTransfer = selectedTx?.transferId != null;
  const boxName = selectedTx
    ? boxes?.find((b) => b.id === selectedTx.boxId)?.name
    : undefined;
  const transferToBoxName = selectedTx?.transferToBoxId
    ? boxes?.find((b) => b.id === selectedTx.transferToBoxId)?.name
    : undefined;

  const getCategoryLabel = (tx: Transaction) => {
    if (typeof tx.category === "object" && tx.category) {
      return tx.category.name;
    }
    const cat = categories.find(
      (c) => c.code === tx.categoryCode || c.code === tx.category,
    );
    return cat?.name || "";
  };

  const getBoxName = (tx: Transaction) =>
    boxes?.find((b) => b.id === tx.boxId)?.name || "";

  const getTransferLabel = (tx: Transaction) => {
    const fromBox = boxes?.find((b) => b.id === tx.boxId)?.name ?? "?";
    const toBox = tx.transferToBoxId
      ? (boxes?.find((b) => b.id === tx.transferToBoxId)?.name ?? "?")
      : "?";
    return { fromBox, toBox };
  };

  // Open drawer
  const openDrawer = (tx: Transaction) => {
    setSelectedTx(tx);
    setDrawerMode("view");
  };

  // Switch to edit mode
  const startEditing = () => {
    if (!selectedTx) return;
    setEditType(selectedTx.type);
    setEditAmount(selectedTx.amount);
    setEditCategoryCode(
      selectedTx.categoryCode ||
        (typeof selectedTx.category === "object"
          ? selectedTx.category.code
          : (selectedTx.category as string)) ||
        "",
    );
    setEditBoxId(selectedTx.boxId || "");
    setEditDate(selectedTx.date.split("T")[0]);
    setEditDescription(selectedTx.description);
    setEditFromBoxId(selectedTx.boxId || "");
    setEditToBoxId(selectedTx.transferToBoxId || "");
    setDrawerMode("edit");
  };

  // Save transaction edit
  const saveTransaction = async () => {
    if (!selectedTx || !isAuthenticated) return;
    setIsSaving(true);
    try {
      const result = await apiService.editTransaction({
        transactionCode: selectedTx.code,
        newAmount: editAmount,
        newDate: editDate,
        newCategory: editCategoryCode || undefined,
        newDescription: editDescription || undefined,
        newType: editType,
        newBoxId: editBoxId || undefined,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      await invalidateAll();
      setSelectedTx(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao editar transação",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Save transfer edit
  const saveTransferEdit = async () => {
    if (!selectedTx?.transferId) return;
    setIsSaving(true);
    try {
      const success = await editTransfer({
        transferId: selectedTx.transferId,
        amount: editAmount,
        date: editDate,
        fromBoxId: editFromBoxId || undefined,
        toBoxId: editToBoxId || undefined,
      });
      if (success) {
        await invalidateAll();
        setSelectedTx(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async () => {
    if (!selectedTx) return;
    setIsDeleting(true);
    try {
      if (isTransfer && selectedTx.transferId) {
        const success = await deleteTransfer(selectedTx.transferId);
        if (success) {
          await invalidateAll();
          setSelectedTx(null);
        }
      } else {
        const result = await apiService.deleteTransaction(selectedTx.code);
        if (result.error) {
          toast.error(result.error);
        } else {
          await invalidateAll();
          setSelectedTx(null);
        }
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Category filtering for edit form
  const filteredCategories = categories
    .filter(
      (cat) =>
        cat.transactionType === "both" || cat.transactionType === editType,
    )
    .map((cat) => ({
      label: cat.name,
      value: cat.code,
      type: cat.transactionType as "income" | "expense" | "both",
    }));

  const editDateValue = editDate ? parseDateLocal(editDate) : undefined;

  // Submit search
  const submitSearch = () => {
    setFiltroDescricao(searchInput);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Filters */}
      <div className="space-y-2 pb-3">
        {/* Label */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-widest">
          <SlidersHorizontal className="size-3" />
          Filtros
        </div>

        {/* Row 1: Month + Search */}
        <div className="flex items-center gap-2">
          <Select
            value={`${filtroAno}-${filtroMes.toString().padStart(2, "0")}`}
            onValueChange={(val) => {
              const [year, month] = val.split("-").map(Number);
              setFiltroAno(year);
              setFiltroMes(month);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 rounded-full border-[var(--color-border)] bg-transparent text-sm px-3 w-auto">
              <SelectValue>{monthLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                const monthName = new Date(2000, i, 1).toLocaleString(
                  "pt-BR",
                  {
                    month: "long",
                  },
                );
                return (
                  <SelectItem
                    key={month}
                    value={`${filtroAno}-${month.toString().padStart(2, "0")}`}
                  >
                    {monthName} {filtroAno}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {/* Search chip */}
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Buscar"
              onClick={() => {
                setShowSearch((prev) => !prev);
                if (showSearch && !filtroDescricao) {
                  setSearchInput("");
                }
              }}
              className={`flex items-center justify-center h-8 rounded-full border ${
                showSearch || filtroDescricao
                  ? `bg-[var(--color-accent-bg)] border-[var(--color-accent-border)] text-[var(--color-accent)] ${filtroDescricao ? "rounded-r-none border-r-0 gap-1.5 px-3" : "w-9"}`
                  : "border-[var(--color-border)] bg-transparent text-muted-foreground w-9"
              }`}
            >
              <Search className="h-4 w-4" />
              {filtroDescricao && (
                <span className="text-sm truncate max-w-[100px]">
                  {filtroDescricao}
                </span>
              )}
            </button>
            {filtroDescricao && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setSearchInput("");
                  setFiltroDescricao("");
                  setShowSearch(false);
                  setCurrentPage(1);
                }}
                className="flex items-center justify-center h-8 w-8 rounded-r-full border border-l-0 bg-[var(--color-accent-bg)] border-[var(--color-accent-border)] text-[var(--color-accent)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category + Box */}
        <div className="flex items-center gap-2">
          {/* Category chip */}
          <div className="flex items-center">
            <Select
              value={filtroCategoria || "__all__"}
              onValueChange={(val) => {
                setFiltroCategoria(val === "__all__" ? "" : val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger
                className={`h-8 rounded-full text-sm px-3 w-auto ${
                  filtroCategoria
                    ? "bg-[var(--color-accent-bg)] border-[var(--color-accent-border)] text-[var(--color-accent)] rounded-r-none border-r-0"
                    : "border-[var(--color-border)] bg-transparent"
                }`}
              >
                <SelectValue>
                  {selectedCategoryName || "Categoria"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtroCategoria && (
              <button
                type="button"
                aria-label="Limpar categoria"
                onClick={() => {
                  setFiltroCategoria("");
                  setCurrentPage(1);
                }}
                className="flex items-center justify-center h-8 w-8 rounded-r-full border border-l-0 bg-[var(--color-accent-bg)] border-[var(--color-accent-border)] text-[var(--color-accent)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Box chip */}
          <div className="flex items-center">
            <Select
              value={filtroCaixinha || "__all__"}
              onValueChange={(val) => {
                setFiltroCaixinha(val === "__all__" ? "" : val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger
                className={`h-8 rounded-full text-sm px-3 w-auto ${
                  filtroCaixinha
                    ? "bg-[var(--color-accent-bg)] border-[var(--color-accent-border)] text-[var(--color-accent)] rounded-r-none border-r-0"
                    : "border-[var(--color-border)] bg-transparent"
                }`}
              >
                <SelectValue>
                  {selectedBoxName || "Carteira"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {boxes?.map((box) => (
                  <SelectItem key={box.id} value={box.id}>
                    {box.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtroCaixinha && (
              <button
                type="button"
                aria-label="Limpar carteira"
                onClick={() => {
                  setFiltroCaixinha("");
                  setCurrentPage(1);
                }}
                className="flex items-center justify-center h-8 w-8 rounded-r-full border border-l-0 bg-[var(--color-accent-bg)] border-[var(--color-accent-border)] text-[var(--color-accent)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search bar (conditional) */}
      {showSearch && (
        <div className="flex gap-2 pb-3">
          <Input
            type="text"
            className="text-sm flex-1"
            placeholder="Buscar por descrição..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            autoFocus
          />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={submitSearch}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Transaction list */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorDisplay
            error={error.message}
            onRetry={mutateTransactions}
            className="my-4"
          />
        ) : transactions.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            Nenhuma transação encontrada
          </div>
        ) : (
          <div className="space-y-1">
            {dateKeys.map((dateKey) => (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="flex items-center gap-2 py-2">
                  <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {formatDateLabel(dateKey)}
                  </span>
                  <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
                </div>

                {/* Transactions for this date */}
                {groupedByDate[dateKey].map((tx) => {
                  const txIsTransfer = tx.transferId != null;
                  const txIsCompletePair =
                    txIsTransfer && tx.transferToBoxId != null;

                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => openDrawer(tx)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors active:bg-muted/50"
                    >
                      {/* Type indicator */}
                      <div className="flex items-center justify-center size-4 shrink-0">
                        {txIsTransfer ? (
                          <ArrowRightLeft className="size-4 text-[var(--color-info)]" />
                        ) : (
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              tx.type === "income"
                                ? "bg-[var(--color-success)]"
                                : "bg-[var(--color-danger)]"
                            }`}
                          />
                        )}
                      </div>

                      {/* Description + metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="text-base text-foreground tracking-tight truncate flex items-center gap-1">
                          {txIsTransfer ? (
                            <>
                              {getTransferLabel(tx).fromBox}
                              <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                              {getTransferLabel(tx).toBox}
                            </>
                          ) : (
                            tx.description || "(Sem descrição)"
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {txIsTransfer
                            ? "Transferência"
                            : [getCategoryLabel(tx), getBoxName(tx)]
                                .filter(Boolean)
                                .join(" \u00B7 ")}
                        </div>
                      </div>

                      {/* Amount */}
                      <span
                        className={`font-mono text-sm font-semibold whitespace-nowrap ${
                          txIsTransfer
                            ? "text-[var(--color-info)]"
                            : tx.type === "income"
                              ? "text-[var(--color-success)]"
                              : "text-[var(--color-danger)]"
                        }`}
                      >
                        {!txIsCompletePair &&
                          (tx.type === "income" ? "+" : "-")}{" "}
                        R$ {formatCurrency(tx.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simplified pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-sm text-muted-foreground">
            {currentPage} / {data.totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            disabled={currentPage >= data.totalPages}
            onClick={() =>
              setCurrentPage(Math.min(data.totalPages, currentPage + 1))
            }
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        open={selectedTx !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTx(null);
            setDrawerMode("view");
          }
        }}
      >
        <DrawerContent>
          {selectedTx && drawerMode === "view" && (
            <>
              <DrawerHeader>
                <DrawerTitle className="font-display text-xl tracking-tight flex items-center gap-1.5">
                  {isTransfer ? (
                    <>
                      {getTransferLabel(selectedTx).fromBox}
                      <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                      {getTransferLabel(selectedTx).toBox}
                    </>
                  ) : (
                    selectedTx.description || "(Sem descrição)"
                  )}
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  Detalhes da transação
                </DrawerDescription>
                <div
                  className={`font-mono text-2xl font-semibold mt-1 ${
                    isTransfer
                      ? "text-[var(--color-info)]"
                      : selectedTx.type === "income"
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-danger)]"
                  }`}
                >
                  {!(isTransfer && selectedTx.transferToBoxId) &&
                    (selectedTx.type === "income" ? "+ " : "- ")}
                  R$ {formatCurrency(selectedTx.amount)}
                </div>
              </DrawerHeader>

              <div className="px-4 space-y-3 pb-4">
                {/* Metadata rows */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data</span>
                  <span className="text-foreground">
                    {formatDateLabel(selectedTx.date.split("T")[0])}
                  </span>
                </div>
                {!isTransfer && getCategoryLabel(selectedTx) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Categoria</span>
                    <span className="text-foreground">
                      {getCategoryLabel(selectedTx)}
                    </span>
                  </div>
                )}
                {isTransfer ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Origem</span>
                      <span className="text-foreground">
                        {boxName ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Destino</span>
                      <span className="text-foreground">
                        {transferToBoxName ?? "—"}
                      </span>
                    </div>
                  </>
                ) : (
                  boxName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Carteira</span>
                      <span className="text-foreground">{boxName}</span>
                    </div>
                  )
                )}
              </div>

              <DrawerFooter>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={startEditing}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}

          {selectedTx && drawerMode === "edit" && (
            <>
              <DrawerHeader>
                <DrawerTitle className="font-display text-xl tracking-tight">
                  {isTransfer ? "Editar transferência" : "Editar transação"}
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  Formulário de edição
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 space-y-3 pb-4">
                {isTransfer ? (
                  <>
                    {/* Transfer edit form */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Valor
                      </label>
                      <MoneyInput
                        value={editAmount}
                        onChange={setEditAmount}
                        className="text-sm"
                      />
                    </div>
                    {boxes && boxes.length > 0 && (
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Origem
                          </label>
                          <Select
                            value={editFromBoxId}
                            onValueChange={setEditFromBoxId}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Origem" />
                            </SelectTrigger>
                            <SelectContent>
                              {boxes.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[var(--color-info)] shrink-0 mt-5" />
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Destino
                          </label>
                          <Select
                            value={editToBoxId}
                            onValueChange={setEditToBoxId}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Destino" />
                            </SelectTrigger>
                            <SelectContent>
                              {boxes.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Data
                      </label>
                      <DatePicker
                        date={editDateValue}
                        onDateChange={(date) =>
                          setEditDate(
                            date ? format(date, "yyyy-MM-dd") : undefined,
                          )
                        }
                        placeholder="Escolha uma data"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Transaction edit form */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Tipo
                      </label>
                      <Select
                        value={editType}
                        onValueChange={(val) => {
                          setEditType(val as "income" | "expense");
                          setEditCategoryCode("");
                        }}
                      >
                        <SelectTrigger
                          className={`text-sm ${
                            editType === "income"
                              ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)]"
                              : "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"
                          }`}
                        >
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Valor
                      </label>
                      <MoneyInput
                        value={editAmount}
                        onChange={setEditAmount}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Categoria
                      </label>
                      <CategorySelect
                        categories={filteredCategories}
                        value={editCategoryCode}
                        onChange={setEditCategoryCode}
                        currentTransactionType={editType}
                      />
                    </div>
                    {boxes && boxes.length > 0 && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Carteira
                        </label>
                        <Select
                          value={editBoxId}
                          onValueChange={setEditBoxId}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Carteira" />
                          </SelectTrigger>
                          <SelectContent>
                            {boxes.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Data
                      </label>
                      <DatePicker
                        date={editDateValue}
                        onDateChange={(date) =>
                          setEditDate(
                            date ? format(date, "yyyy-MM-dd") : undefined,
                          )
                        }
                        placeholder="Escolha uma data"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Descrição
                      </label>
                      <Input
                        type="text"
                        className="text-sm"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Descrição"
                      />
                    </div>
                  </>
                )}
              </div>

              <DrawerFooter>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={isTransfer ? saveTransferEdit : saveTransaction}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Salvar
                  </Button>
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => setDrawerMode("view")}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isTransfer
                ? "Tem certeza que deseja deletar a transferência?"
                : "Tem certeza que deseja deletar a transação?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.{" "}
              {isTransfer
                ? "Esta transferência será deletada permanentemente."
                : "Esta transação será deletada permanentemente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={isDeleting}
              >
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild onClick={handleDeleteTransaction}>
              <Button
                variant="destructive"
                type="button"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Deletar
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
