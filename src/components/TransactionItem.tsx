import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { useApi } from "../hooks/useApi";
import type { Category } from "../hooks/useCategories";
import type { Transaction } from "./TransacoesTab";
import { CategorySelect } from "./CategorySelect";

type TransactionItemProps = {
  transaction: Transaction;
  categorias?: Category[]; // Agora é opcional
  onUpdate?: () => Promise<void>;
};

export function TransactionItem({
  transaction: txOriginal,
  categorias,
  onUpdate,
}: TransactionItemProps) {
  const apiService = useApi();
  const [editState, setEditState] = useState<Partial<Transaction>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Garantir que a transação tenha categoryCode definido
  const tx = {
    ...txOriginal,
    categoryCode: txOriginal.categoryCode || txOriginal.category,
  };

  type CategoryWithType = {
    label: string;
    value: string;
    type: "income" | "expense" | "both";
  };

  // Converter categorias da API para o formato usado no componente
  const categories: CategoryWithType[] = categorias
    ? categorias.map((cat: Category) => ({
        label: cat.name,
        value: cat.code,
        type: cat.type === "both" 
          ? "both" 
          : (cat.type as "income" | "expense"),
      }))
    : []; // array vazio se não houver categorias


  // Função para remover o estado de edição

  // Função para remover o estado de edição
  function clearEditState() {
    setEditState({});
    setError(null);
  }
  // Função para salvar a edição na API
  async function saveChanges() {
    if (!apiService.isAuthenticated()) {
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const result = await apiService.editTransaction({
        transactionCode: tx.code,
        newAmount:
          editState.amount !== undefined
            ? Number(editState.amount)
            : undefined,
        newDate: editState.date,
        newCategory: editState.categoryCode,
        newDescription: editState.description,
        newType: editState.type,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (onUpdate) {
        await onUpdate();
      }

      clearEditState();
      toast.success("Transação editada com sucesso!", { closeButton: true });
    } catch (err) {
      console.error("Erro ao editar transação:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AccordionItem value={tx.id} key={tx.id}>
      <AccordionTrigger className="py-2">
        <div className="flex items-center gap-2 rounded px-1 flex-1 text-base">
          <div
            className={`w-2 h-2 rounded-full ${
              tx.type === "income" ? "bg-green-400" : "bg-red-400"
            }`}
          />
          <div className="flex-1">
            <div className="font-medium text-gray-300 mb-1">
              {tx.description || "(Sem descrição)"}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(tx.date).toLocaleDateString("pt-BR")} •{" "}
              {categories.find((c) => c.value === tx.category)?.label ||
                tx.category}
            </div>
          </div>
          <div
            className={`font-semibold ${
              tx.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            {tx.type === "income" ? "+" : "-"} R${" "}
            {tx.amount.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <form
          className="space-y-2 rounded p-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveChanges();
          }}
        >
          <div className="flex gap-2 mb-2">
            <div className="flex flex-col gap-1 w-[120px]">
              <Select
                value={editState.type ?? tx.type}
                onValueChange={(val) =>
                  setEditState((s) => ({
                    ...s,
                    type: val as "income" | "expense",
                    // Limpar a categoria quando mudar o tipo para evitar tipos incompatíveis
                    categoryCode: undefined,
                  }))
                }
              >
                <SelectTrigger 
                  className={`text-xs ${
                    (editState.type ?? tx.type) === "income" 
                      ? "border-green-500 bg-green-100/10" 
                      : "border-red-500 bg-red-100/10"
                  }`}
                >
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">💰 Receita</SelectItem>
                  <SelectItem value="expense">💸 Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              className="text-xs"
              value={
                editState.amount !== undefined ? editState.amount : tx.amount
              }
              onChange={(e) =>
                setEditState((s) => ({
                  ...s,
                  amount: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="flex gap-2">
            <CategorySelect
              categories={categories}
              value={editState.categoryCode ?? tx.categoryCode}
              onChange={(val) =>
                setEditState((s) => ({
                  ...s,
                  categoryCode: val,
                }))
              }
              currentTransactionType={editState.type ?? tx.type}
            />
          </div>
          <Input
            className="text-xs"
            value={editState.description ?? tx.description}
            onChange={(e) =>
              setEditState((s) => ({
                ...s,
                description: e.target.value,
              }))
            }
            placeholder="Descrição"
          />
          <Input
            type="date"
            className="text-xs"
            // 
            value={editState.date ?? tx.date.substring(0, 10)}
            onChange={(e) =>
              setEditState((s) => ({
                ...s,
                date: e.target.value,
              }))
            }
          />
          <div className="flex gap-2 justify-end">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearEditState}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
          {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
        </form>
      </AccordionContent>
    </AccordionItem>
  );
}
