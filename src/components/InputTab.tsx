import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategorySelect } from "@/components/CategorySelect";
import { DatePicker } from "@/components/DatePicker";
import { useCreateTransaction } from "@/hooks/useCreateTransaction";
import { useCategories } from "@/hooks/useCategories";
import { useBoxes } from "@/hooks/useBoxes";
import { useTransfer } from "@/hooks/useTransfer";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowRightLeftIcon, DollarSignIcon } from "lucide-react";

// Helper function for date formatting
const getISODateString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type InputMode = 'transaction' | 'transfer';

// ── Bespoke Segmented Control ──

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon: React.ReactNode }[];
}) {
  const activeIndex = options.findIndex((o) => o.value === value);

  return (
    <div className="relative flex rounded-lg border border-border p-0.5 bg-background">
      {/* Animated pill indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-md bg-[var(--color-accent)] transition-all duration-200"
        style={{
          width: `calc(${100 / options.length}% - 2px)`,
          left: `calc(${(activeIndex * 100) / options.length}% + 1px)`,
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
            value === opt.value
              ? "text-[var(--color-bg)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function InputTab() {
  const [mode, setMode] = useState<InputMode>('transaction');

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as InputMode)}
        options={[
          { value: "transaction", label: "Transação", icon: <DollarSignIcon className="h-3.5 w-3.5" /> },
          { value: "transfer", label: "Transferência", icon: <ArrowRightLeftIcon className="h-3.5 w-3.5" /> },
        ]}
      />

      {mode === 'transaction' ? <TransactionForm /> : <TransferForm />}
    </div>
  );
}

function TransactionForm() {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string>('');
  const [categorySelectOpened, setCategorySelectOpened] = useState(false);
  const categoryManuallySelected = useRef(false);

  const { createTransaction } = useCreateTransaction();
  const { data: categories } = useCategories();
  const { boxes } = useBoxes();
  const { apiService } = useApi();

  // Pre-select the default box when boxes data loads
  useEffect(() => {
    if (boxes && boxes.length > 0 && !selectedBoxId) {
      const defaultBox = boxes.find(box => box.isDefault);
      if (defaultBox) {
        setSelectedBoxId(defaultBox.id);
      } else {
        setSelectedBoxId(boxes[0].id);
      }
    }
  }, [boxes, selectedBoxId]);

  // Filter categories based on transaction type
  const filteredCategories = categories?.filter(cat =>
    cat.transactionType === type || cat.transactionType === 'both'
  ) || [];

  const handleDescriptionBlur = async () => {
    if (!description.trim() || categorySelectOpened || categoryManuallySelected.current) return;

    try {
      const result = await apiService.suggestCategory({
        description: description.trim(),
        transactionType: type,
      });

      if (result.categoryId && !categorySelectOpened && !categoryManuallySelected.current) {
        setCategoryId(result.categoryId);
      }
    } catch (error) {
      console.error('Error suggesting category:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Por favor, insira um valor valido");
      return;
    }

    if (!description.trim()) {
      toast.error("Por favor, insira uma descricao");
      return;
    }

    if (!date) {
      toast.error("Por favor, selecione uma data");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createTransaction({
        amount: parseFloat(amount),
        description: description.trim(),
        categoryId: categoryId || undefined,
        date: getISODateString(date),
        type: type,
        boxId: selectedBoxId || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${type === 'income' ? 'Receita' : 'Despesa'} registrada com sucesso!`);

        // Reset form
        setDescription('');
        setAmount('');
        setCategoryId('');
        setDate(new Date());
        categoryManuallySelected.current = false;
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error("Erro ao registrar transacao");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Type */}
      <SegmentedControl
        value={type}
        onChange={(v) => setType(v as 'income' | 'expense')}
        options={[
          { value: "expense", label: "Despesa", icon: null },
          { value: "income", label: "Receita", icon: null },
        ]}
      />

      {/* Amount — protagonist input */}
      <div className="py-2">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-lg font-mono text-muted-foreground">R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full max-w-[200px] bg-transparent text-center text-3xl font-bold font-mono text-foreground placeholder:text-muted-foreground focus:outline-none border-b-2 border-[var(--color-border)] focus:border-[var(--color-accent)] transition-colors pb-1"
          />
        </div>
      </div>

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

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <DatePicker
          date={date}
          onDateChange={setDate}
          placeholder="Selecione uma data"
        />
      </div>

      {/* Box */}
      <div className="space-y-2">
        <Label htmlFor="box">Caixa</Label>
        <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma caixa" />
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

      {/* Category - moved to last to give time for AI suggestion */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Categoria
        </Label>
        <CategorySelect
          categories={filteredCategories.map(cat => ({
            label: cat.name,
            value: cat.id,
            type: cat.transactionType
          }))}
          value={categoryId}
          onChange={handleCategoryChange}
          currentTransactionType={type}
          onOpenChange={handleCategorySelectOpenChange}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Registrando...' : `Registrar ${type === 'income' ? 'Receita' : 'Despesa'}`}
      </Button>
    </form>
  );
}

function TransferForm() {
  const [fromBoxId, setFromBoxId] = useState('');
  const [toBoxId, setToBoxId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { boxes } = useBoxes();
  const { createTransfer } = useTransfer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromBoxId || !toBoxId) {
      toast.error("Selecione as carteiras de origem e destino");
      return;
    }

    if (fromBoxId === toBoxId) {
      toast.error("As carteiras de origem e destino devem ser diferentes");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Por favor, insira um valor valido");
      return;
    }

    if (!date) {
      toast.error("Por favor, selecione uma data");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTransfer({
        fromBoxId,
        toBoxId,
        amount: parsedAmount,
        date: getISODateString(date),
      });

      if (result) {
        // Reset form
        setFromBoxId('');
        setToBoxId('');
        setAmount('');
        setDate(new Date());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount — protagonist input */}
      <div className="py-2">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-lg font-mono text-muted-foreground">R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full max-w-[200px] bg-transparent text-center text-3xl font-bold font-mono text-foreground placeholder:text-muted-foreground focus:outline-none border-b-2 border-[var(--color-border)] focus:border-[var(--color-accent)] transition-colors pb-1"
          />
        </div>
      </div>

      {/* From box */}
      <div className="space-y-2">
        <Label>Origem</Label>
        <Select value={fromBoxId} onValueChange={setFromBoxId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a carteira de origem" />
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

      {/* To box */}
      <div className="space-y-2">
        <Label>Destino</Label>
        <Select value={toBoxId} onValueChange={setToBoxId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a carteira de destino" />
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
        <Label>Data</Label>
        <DatePicker
          date={date}
          onDateChange={setDate}
          placeholder="Selecione uma data"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Transferindo...' : 'Transferir'}
      </Button>
    </form>
  );
}
