import { CategorySelect } from "@/components/CategorySelect";
import { DatePicker } from "@/components/DatePicker";
import { EstratoSelect } from "@/components/EstratoSelect";
import { MoneyInput } from "@/components/MoneyInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/useApi";
import { useCategories } from "@/hooks/useCategories";
import { useCreateTransaction } from "@/hooks/useCreateTransaction";
import { useTransfer } from "@/hooks/useTransfer";
import { format } from "date-fns";
import { ArrowDown } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ── Helpers ──

const getISODateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

// ── Types ──

type InputMode = "expense" | "income" | "transfer";

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

  // ── Shared state ──
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Transaction state (expense / income) ──
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedBoxId, setSelectedBoxId] = useState<string>("");
  const [categorySelectOpened, setCategorySelectOpened] = useState(false);
  const categoryManuallySelected = useRef(false);

  // ── Transfer state ──
  const [fromBoxId, setFromBoxId] = useState("");
  const [toBoxId, setToBoxId] = useState("");

  // ── Hooks ──
  const { createTransaction } = useCreateTransaction();
  const { data: categories } = useCategories();
  const { createTransfer } = useTransfer();
  const { apiService } = useApi();

  const activeColor = MODE_CONFIG[mode].color;
  const isTransfer = mode === "transfer";

  // Filter categories based on transaction type
  const filteredCategories =
    categories?.filter(
      (cat) => cat.transactionType === mode || cat.transactionType === "both",
    ) || [];

  // ── AI category suggestion ──
  const handleDescriptionBlur = async () => {
    if (
      !description.trim() ||
      categorySelectOpened ||
      categoryManuallySelected.current ||
      isTransfer
    )
      return;

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

  // ── Reset form ──
  const resetForm = () => {
    setAmount(0);
    setDate(new Date());
    if (isTransfer) {
      setFromBoxId("");
      setToBoxId("");
    } else {
      setDescription("");
      setCategoryId("");
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

      setIsSubmitting(true);
      try {
        const result = await createTransaction({
          amount,
          description: description.trim(),
          categoryId: categoryId || undefined,
          date: getISODateString(date),
          type: mode as "expense" | "income",
          boxId: selectedBoxId || undefined,
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          resetForm();
        }
      } catch (error) {
        console.error("Error creating transaction:", error);
        toast.error("Erro ao registrar transação");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      {/* 3-option segmented control */}
      <div className="mb-5">
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Hero amount — generous spacing establishes visual hierarchy */}
        <div className="flex flex-col items-center pt-2 pb-6">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-base font-mono text-muted-foreground">R$</span>
            <MoneyInput
              value={amount}
              onChange={setAmount}
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
                onDateChange={setDate}
                placeholder="Selecione uma data"
              />
            </>
          ) : (
            <>
              <Input
                id="description"
                type="text"
                placeholder="Descrição (ex: Almoço, Salário)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                required
              />

              <DatePicker date={date} onDateChange={setDate} placeholder="Data" />
              <EstratoSelect
                value={selectedBoxId}
                onChange={setSelectedBoxId}
                placeholder="Selecione o estrato"
                className="w-full border-[var(--color-accent-border)]"
              />

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
              />
            </>
          )}
        </div>

        {/* Action zone — clear separation from form fields */}
        <div className="pt-5">
          <Button
            type="submit"
            className="w-full bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]/80"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isTransfer
                ? "Transferindo..."
                : "Registrando..."
              : MODE_CONFIG[mode].cta}
          </Button>
        </div>
      </form>
    </div>
  );
}
