import { CategorySelect } from "@/components/CategorySelect";
import { DatePicker } from "@/components/DatePicker";
import { EstratoSelect } from "@/components/EstratoSelect";
import { MoneyInput } from "@/components/MoneyInput";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useCategories } from "@/hooks/useCategories";
import { useCreateTransaction } from "@/hooks/useCreateTransaction";
import { usePaymentAllocations } from "@/hooks/usePaymentAllocations";
import { useTransfer } from "@/hooks/useTransfer";
import type { AllocationSuggestion } from "@/services/api.interface";
import { format } from "date-fns";
import { ArrowDown, Check } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ── Formatters ──

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

// ── Helpers ──

const getISODateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

const isToday = (date: Date): boolean => {
  return date.toDateString() === new Date().toDateString();
};

// ── Types ──

type InputMode = "expense" | "income" | "transfer";
type ExpenseSubtype = "daily" | "planned";

const MODE_CONFIG: Record<
  InputMode,
  { label: string; color: string; cta: string }
> = {
  expense: {
    label: "Despesa",
    color: "var(--color-danger)",
    cta: "Registrar",
  },
  income: {
    label: "Receita",
    color: "var(--color-success)",
    cta: "Registrar",
  },
  transfer: {
    label: "Transferência",
    color: "var(--color-info)",
    cta: "Transferir",
  },
};

const MODES: InputMode[] = ["expense", "income", "transfer"];

// ── Expense Subtype Selector ──

function ExpenseSubtypeSelector({
  value,
  onChange,
}: {
  value: ExpenseSubtype;
  onChange: (subtype: ExpenseSubtype) => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        aria-pressed={value === "daily"}
        onClick={() => onChange("daily")}
        className={cn(
          "flex-1 flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl border-2 transition-colors duration-200",
          value === "daily"
            ? "bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success)]"
            : "bg-muted/30 border-[var(--color-border)] text-muted-foreground hover:border-muted-foreground/50"
        )}
      >
        <span className="text-xl">🛒</span>
        <span className="text-xs font-semibold">Dia a dia</span>
      </button>
      <button
        type="button"
        aria-pressed={value === "planned"}
        onClick={() => onChange("planned")}
        className={cn(
          "flex-1 flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl border-2 transition-colors duration-200",
          value === "planned"
            ? "bg-[var(--color-info-bg)] border-[var(--color-info-border)] text-[var(--color-info)]"
            : "bg-muted/30 border-[var(--color-border)] text-muted-foreground hover:border-muted-foreground/50"
        )}
      >
        <span className="text-xl">📋</span>
        <span className="text-xs font-semibold">Planejada</span>
      </button>
    </div>
  );
}

// ── Segmented Control ──

function ModeSelector({
  value,
  onChange,
}: {
  value: InputMode;
  onChange: (mode: InputMode) => void;
}) {
  const activeIndex = MODES.indexOf(value);
  const activeColor = MODE_CONFIG[value].color;

  return (
    <div className="flex justify-center">
      <div className="relative flex w-full rounded-lg p-1 bg-muted/50 border border-[var(--color-border)]">
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 rounded-md bg-muted transition-all duration-200"
          style={{
            width: `calc((100% - 8px) / ${MODES.length})`,
            left: `calc(${activeIndex} * (100% - 8px) / ${MODES.length} + 4px)`,
            borderWidth: 2,
            borderStyle: "solid",
            borderColor: activeColor,
          }}
        />
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`relative z-10 flex-1 flex justify-center items-center py-2 px-1 rounded-md text-sm font-medium transition-colors
              truncate  duration-200 ${
                value === mode
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {MODE_CONFIG[mode].label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──

export function InputTab() {
  const [mode, setMode] = useState<InputMode>("expense");
  const [expenseSubtype, setExpenseSubtype] = useState<ExpenseSubtype>("daily");

  // ── Shared state ──
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dateManuallyChanged = useRef(false);

  const flashSuccess = useCallback(() => {
    setShowSuccess(true);
    clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setShowSuccess(false), 600);
  }, []);

  // ── Transaction state (expense / income) ──
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedBoxId, setSelectedBoxId] = useState<string>("");
  const [categorySelectOpened, setCategorySelectOpened] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const categoryManuallySelected = useRef(false);

  // ── Allocation state (expense tagging) ──
  const [allocationId, setAllocationId] = useState<string>("");

  // ── Suggestion state ──
  const [suggestion, setSuggestion] = useState<AllocationSuggestion | null>(null);
  const [pendingTransactionCode, setPendingTransactionCode] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // ── Transfer state ──
  const [fromBoxId, setFromBoxId] = useState("");
  const [toBoxId, setToBoxId] = useState("");

  // ── Refs for auto-advance ──
  const descriptionRef = useRef<HTMLInputElement>(null);
  const estratoSelectTriggerRef = useRef<HTMLButtonElement>(null);
  const fromBoxTriggerRef = useRef<HTMLButtonElement>(null);

  // ── Hooks ──
  const { createTransaction } = useCreateTransaction();
  const { data: categories } = useCategories();
  const { createTransfer } = useTransfer();
  const { apiService } = useApi();
  const { allocations: paymentAllocations } = usePaymentAllocations();

  const activeColor = MODE_CONFIG[mode].color;
  const isTransfer = mode === "transfer";

  // Filter categories based on transaction type
  const filteredCategories =
    categories?.filter(
      (cat) => cat.transactionType === mode || cat.transactionType === "both",
    ) || [];

  // ── Date change with sticky tracking ──
  const handleDateChange = useCallback((newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      dateManuallyChanged.current = !isToday(newDate);
    }
  }, []);

  // ── AI category suggestion ──
  const handleDescriptionBlur = async () => {
    if (
      !description.trim() ||
      categorySelectOpened ||
      categoryManuallySelected.current ||
      isTransfer ||
      (mode === "expense" && expenseSubtype === "planned")
    )
      return;

    setIsSuggestingCategory(true);
    try {
      const result = await apiService.suggestCategory({
        description: description.trim(),
        transactionType: mode as "expense" | "income",
      });

      if (
        result.categoryId &&
        !categorySelectOpened &&
        !categoryManuallySelected.current
      ) {
        setCategoryId(result.categoryId);
      }
    } catch (error) {
      console.error("Error suggesting category:", error);
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    categoryManuallySelected.current = true;
    setCategoryId(value);
  };

  const handleCategorySelectOpenChange = (open: boolean) => {
    setCategorySelectOpened(open);
    if (open) {
      categoryManuallySelected.current = true;
    }
  };

  const handleExpenseSubtypeChange = (subtype: ExpenseSubtype) => {
    setExpenseSubtype(subtype);
    if (subtype === "daily") {
      setAllocationId("");
    } else {
      setCategoryId("");
      categoryManuallySelected.current = false;
    }
  };

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode);
    setExpenseSubtype("daily");
  };

  // ── Reset form ──
  const resetForm = () => {
    setAmount(0);
    if (!dateManuallyChanged.current) {
      setDate(new Date());
    }
    if (isTransfer) {
      setFromBoxId("");
      setToBoxId("");
    } else {
      setDescription("");
      setCategoryId("");
      setAllocationId("");
      categoryManuallySelected.current = false;
    }
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    if (!date) {
      toast.error("Por favor, selecione uma data");
      return;
    }

    if (isTransfer) {
      if (!fromBoxId || !toBoxId) {
        toast.error("Selecione os estratos de origem e destino");
        return;
      }
      if (fromBoxId === toBoxId) {
        toast.error("Os estratos de origem e destino devem ser diferentes");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await createTransfer({
          fromBoxId,
          toBoxId,
          amount,
          date: getISODateString(date),
        });
        if (result) {
          flashSuccess();
          resetForm();
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!description.trim()) {
        toast.error("Por favor, insira uma descrição");
        return;
      }

      const isPlanned = mode === "expense" && expenseSubtype === "planned" && paymentAllocations.length > 0;

      if (isPlanned && !allocationId) {
        toast.error("Selecione uma alocação do plano");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await createTransaction({
          amount,
          description: description.trim(),
          categoryId: isPlanned ? undefined : (categoryId || undefined),
          date: getISODateString(date),
          type: mode as "expense" | "income",
          boxId: selectedBoxId || undefined,
          allocationId: isPlanned ? allocationId : undefined,
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          flashSuccess();
          resetForm();

          if (result.suggestion && result.transaction?.code) {
            setSuggestion(result.suggestion);
            setPendingTransactionCode(result.transaction.code);
          }
        }
      } catch (error) {
        console.error("Error creating transaction:", error);
        toast.error("Erro ao registrar transação");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ── Suggestion handlers ──
  const handleLinkSuggestion = useCallback(async () => {
    if (!suggestion || !pendingTransactionCode) return;

    setIsLinking(true);
    try {
      const result = await apiService.editTransaction({
        transactionCode: pendingTransactionCode,
        newAllocationId: suggestion.allocationId,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Transação vinculada ao compromisso do plano");
      }
    } catch {
      toast.error("Erro ao vincular transação");
    } finally {
      setIsLinking(false);
      setSuggestion(null);
      setPendingTransactionCode(null);
    }
  }, [suggestion, pendingTransactionCode, apiService]);

  const handleDismissSuggestion = useCallback(() => {
    setSuggestion(null);
    setPendingTransactionCode(null);
  }, []);

  // ── Auto-advance helpers ──
  const focusDescription = useCallback(() => {
    descriptionRef.current?.focus();
  }, []);

  const focusFirstTransferBox = useCallback(() => {
    fromBoxTriggerRef.current?.focus();
  }, []);

  const handleDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      descriptionRef.current?.blur();
    }
  };

  const focusEstratoSelect = useCallback(() => {
    estratoSelectTriggerRef.current?.focus();
  }, []);

  return (
    <div>
      {/* Allocation suggestion dialog */}
      <AlertDialog
        open={!!suggestion}
        onOpenChange={(open) => {
          if (!open) handleDismissSuggestion();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vincular ao plano?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Essa despesa parece ser{" "}
                  <span className="font-medium text-foreground">
                    {suggestion?.scheduledMovement.label}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {suggestion?.allocationLabel}
                  </span>{" "}
                  (
                  <span className="font-mono">
                    {suggestion
                      ? formatCurrency(suggestion.scheduledMovement.amount)
                      : ""}
                  </span>
                  ). Vincular ao compromisso do plano?
                </p>
                {suggestion && suggestion.divergencePercent > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Valor esperado:{" "}
                    <span className="font-mono">
                      {formatCurrency(suggestion.scheduledMovement.amount)}
                    </span>{" "}
                    · Diferença:{" "}
                    <span className="font-mono">
                      {formatCurrency(Math.abs(suggestion.divergenceAmount))}
                    </span>{" "}
                    ({suggestion.divergencePercent.toFixed(1)}%)
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDismissSuggestion}>
              Não vincular
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLinkSuggestion}
              disabled={isLinking}
              className="bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]/80"
            >
              {isLinking ? "Vinculando..." : "Vincular"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 3-option segmented control */}
      <div className="mb-5">
        <ModeSelector value={mode} onChange={handleModeChange} />
      </div>

      {mode === "expense" && paymentAllocations.length > 0 && (
        <div className="mb-5">
          <ExpenseSubtypeSelector
            value={expenseSubtype}
            onChange={handleExpenseSubtypeChange}
          />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Hero amount — generous spacing establishes visual hierarchy */}
        <div className="flex flex-col items-center pt-2 pb-6">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-base font-mono text-muted-foreground">R$</span>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              onNext={isTransfer ? focusFirstTransferBox : focusDescription}
              required
              className="w-full max-w-[240px] bg-transparent! text-center text-3xl font-bold font-mono text-foreground border-0 border-b-2 has-[:focus-visible]:ring-0 rounded-none shadow-none py-2 h-auto"
              style={{ borderColor: activeColor }}
            />
          </div>
        </div>

        {/* Form fields — tighter spacing subordinates to hero */}
        <div className="space-y-3">
          {isTransfer ? (
            <>
              {/* From → To as unified visual group */}
              <div className="flex flex-col gap-2">
                <Label className="sr-only">Origem</Label>
                <EstratoSelect
                  value={fromBoxId}
                  onChange={setFromBoxId}
                  placeholder="Selecione a origem"
                  className="w-full"
                  triggerRef={fromBoxTriggerRef}
                />
                <div className="flex items-center justify-center h-8 w-8 rounded-full border border-[var(--color-accent-border)] mx-auto">
                  <ArrowDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <Label className="sr-only">Destino</Label>
                <EstratoSelect
                  value={toBoxId}
                  onChange={setToBoxId}
                  placeholder="Selecione o destino"
                  className="w-full"
                />
              </div>

              <DatePicker
                date={date}
                onDateChange={handleDateChange}
                placeholder="Selecione uma data"
              />
            </>
          ) : (
            <>
              <Input
                ref={descriptionRef}
                id="description"
                type="text"
                enterKeyHint="next"
                placeholder="Descrição (ex: Almoço, Salário)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                onKeyDown={handleDescriptionKeyDown}
                required
              />

              <DatePicker
                date={date}
                onDateChange={handleDateChange}
                onClose={focusEstratoSelect}
                placeholder="Data"
              />
              <EstratoSelect
                value={selectedBoxId}
                onChange={setSelectedBoxId}
                placeholder="Selecione o estrato"
                className="w-full border-[var(--color-accent-border)]"
                triggerRef={estratoSelectTriggerRef}
              />

              {/* Category — only for "dia a dia" expenses and income */}
              {(mode !== "expense" || expenseSubtype === "daily" || paymentAllocations.length === 0) && (
                <CategorySelect
                  categories={filteredCategories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                    type: cat.transactionType,
                  }))}
                  value={categoryId}
                  onChange={handleCategoryChange}
                  currentTransactionType={mode as "expense" | "income"}
                  onOpenChange={handleCategorySelectOpenChange}
                  isLoading={isSuggestingCategory}
                />
              )}

              {/* Allocation — only for "planejada" expenses */}
              {mode === "expense" && expenseSubtype === "planned" && paymentAllocations.length > 0 && (
                <Select
                  value={allocationId}
                  onValueChange={setAllocationId}
                >
                  <SelectTrigger className="w-full text-sm text-muted-foreground border-[var(--color-border)]">
                    <SelectValue placeholder="Selecionar alocação do plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentAllocations.map((allocation) => (
                      <SelectItem key={allocation.id} value={allocation.id}>
                        {allocation.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
        </div>

        {/* Action zone — clear separation from form fields */}
        <div className="pt-5">
          <Button
            type="submit"
            className={cn(
              "w-full border transition-colors duration-200",
              showSuccess
                ? "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)]"
                : "bg-[var(--color-accent-bg)] text-[var(--color-accent)] border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]/80",
            )}
            disabled={isSubmitting}
          >
            {showSuccess ? (
              <Check className="h-5 w-5" />
            ) : isSubmitting ? (
              isTransfer ? "Transferindo..." : "Registrando..."
            ) : (
              MODE_CONFIG[mode].cta
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
