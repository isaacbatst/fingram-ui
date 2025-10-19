import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategorySelect } from "@/components/CategorySelect";
import { DatePicker } from "@/components/DatePicker";
import { useCreateTransaction } from "@/hooks/useCreateTransaction";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import { format } from "date-fns";

// Helper function for date formatting
const getISODateString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export function InputTab() {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTransaction } = useCreateTransaction();
  const { data: categories } = useCategories();

  // Filter categories based on transaction type
  const filteredCategories = categories?.filter(cat => 
    cat.transactionType === type || cat.transactionType === 'both'
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    if (!description.trim()) {
      toast.error("Por favor, insira uma descrição");
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
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error("Erro ao registrar transação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Despesa</SelectItem>
              <SelectItem value="income">Receita</SelectItem>
            </SelectContent>
          </Select>
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
            required
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <CategorySelect
            categories={filteredCategories.map(cat => ({
              label: cat.name,
              value: cat.id,
              type: cat.transactionType
            }))}
            value={categoryId}
            onChange={setCategoryId}
            currentTransactionType={type}
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

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registrando...' : `Registrar ${type === 'income' ? 'Receita' : 'Despesa'}`}
        </Button>
      </form>
    </div>
  );
}
