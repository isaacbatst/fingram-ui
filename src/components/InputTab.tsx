import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/MoneyInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "@/components/CategorySelect";
import { DatePicker } from "@/components/DatePicker";
import { useCreateTransaction } from "@/hooks/useCreateTransaction";
import { useCategories } from "@/hooks/useCategories";
import { useBoxes } from "@/hooks/useBoxes";
import { useTransfer } from "@/hooks/useTransfer";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowDown } from "lucide-react";

// ── Helpers ──

const getISODateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// ── Types ──

type InputMode = "expense" | "income" | "transfer";

const MODE_CONFIG: Record<
  InputMode,
  { label: string; color: string; cta: string }
> = {
  expense: {
    label: "Despesa",
    color: "var(--color-danger)",
    cta: "Registrar Despesa",
  },
  income: {
    label: "Receita",
    color: "var(--color-success)",
    cta: "Registrar Receita",
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
  const { boxes } = useBoxes();
  const { createTransfer } = useTransfer();
  const { apiService } = useApi();

  const activeColor = MODE_CONFIG[mode].color;
  const isTransfer = mode === "transfer";

  // Pre-select default box on load
  useEffect(() => {
    if (boxes && boxes.length > 0 && !selectedBoxId) {
      const defaultBox = boxes.find((box) => box.isDefault);
      if (defaultBox) {
        setSelectedBoxId(defaultBox.id);
      } else {
        setSelectedBoxId(boxes[0].id);
      }
    }
  }, [boxes, selectedBoxId]);

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
        toast.error("Selecione as carteiras de origem e destino");
        return;
      }
      if (fromBoxId === toBoxId) {
        toast.error("As carteiras de origem e destino devem ser diferentes");
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
          toast.success(
            `${mode === "income" ? "Receita" : "Despesa"} registrada com sucesso!`,
          );
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
    <div className="space-y-5">
      {/* 3-option segmented control */}
      <ModeSelector value={mode} onChange={setMode} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hero amount input */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-lg font-mono text-muted-foreground">R$</span>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              required
              className="w-full max-w-[200px] bg-transparent! text-center text-3xl font-bold font-mono text-foreground focus:outline-none border-0 border-b-2 focus-visible:ring-0 rounded-none shadow-none py-2"
              style={{ borderColor: activeColor }}
            />
          </div>
        </div>

        {isTransfer ? (
          <>
            {/* From → To boxes */}
            <div className="space-y-2">
              <Label className="sr-only">Origem</Label>
              <Select value={fromBoxId} onValueChange={setFromBoxId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {boxes?.map((box) => (
                    <SelectItem key={box.id} value={box.id}>
                      {box.name} ({formatCurrency(box.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center">
              <ArrowDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="sr-only">Destino</Label>
              <Select value={toBoxId} onValueChange={setToBoxId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  {boxes?.map((box) => (
                    <SelectItem key={box.id} value={box.id}>
                      {box.name} ({formatCurrency(box.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="sr-only">Data</Label>
              <DatePicker
                date={date}
                onDateChange={setDate}
                placeholder="Selecione uma data"
              />
            </div>
          </>
        ) : (
          <>
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                type="text"
                placeholder="Ex: Almoço, Salário, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                required
              />
            </div>

            {/* Date + Box: 2-column grid */}
            <div className="flex flex-col md:grid md:grid-cols-2 gap-3 self-stretch">
              <div className="space-y-2">
                <Label>Data</Label>
                <DatePicker
                  date={date}
                  onDateChange={setDate}
                  placeholder="Selecione uma data"
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label>Caixa</Label>
                <Select
                  value={selectedBoxId}
                  onValueChange={setSelectedBoxId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes?.map((box) => (
                      <SelectItem key={box.id} value={box.id}>
                        {box.name} ({formatCurrency(box.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoria</Label>
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
            </div>
          </>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? isTransfer
              ? "Transferindo..."
              : "Registrando..."
            : MODE_CONFIG[mode].cta}
        </Button>
      </form>
    </div>
  );
}
