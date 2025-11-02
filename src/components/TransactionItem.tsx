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
import { Check, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApi } from "../hooks/useApi";
import type { Category } from "../hooks/useCategories";
import { CategorySelect } from "./CategorySelect";
import { DatePicker } from "./DatePicker";
import type { Transaction } from "./TransacoesTab";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

type TransactionItemProps = {
  transaction: Transaction;
  categorias?: Category[]; // Agora é opcional
  onUpdate?: () => Promise<void>;
};

const dateOnly = (date: string) => {
  return date.split("T")[0].split("-").reverse().join("/");
};

export function TransactionItem({
  transaction: txOriginal,
  categorias,
  onUpdate,
}: TransactionItemProps) {
  const { apiService, isAuthenticated } = useApi();
  const [editState, setEditState] = useState<
    Partial<Transaction & { transactionFormattedDate: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garantir que a transação tenha categoryCode definido
  const tx = {
    ...txOriginal,
    categoryCode:
      txOriginal.categoryCode ||
      (typeof txOriginal.category === "object"
        ? txOriginal.category.code
        : txOriginal.category),
  };

  // Efeito para redefinir editState.categoryCode quando as categorias mudarem
  // e a categoria atual não estiver mais na lista
  useEffect(() => {
    if (categorias && editState.categoryCode) {
      const categoryExists = categorias.some(
        (c) => c.code === editState.categoryCode
      );
      if (!categoryExists) {
        console.log(
          "Categoria não encontrada no novo conjunto, resetando:",
          editState.categoryCode
        );
        setEditState((state) => ({
          ...state,
          categoryCode: tx.categoryCode,
        }));
      }
    }
  }, [categorias, editState.categoryCode, tx.categoryCode]);

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
        type:
          cat.transactionType === "both"
            ? "both"
            : (cat.transactionType as "income" | "expense"),
      }))
    : []; // array vazio se não houver categorias

  // Log para debug de categorias
  useEffect(() => {
    if (categorias && categorias.length > 0) {
      console.log(
        `TransactionItem: ${categorias.length} categorias carregadas`
      );
    }
  }, [categorias]);

  // Filtrar categorias com base no tipo da transação atual
  const filteredCategories = categories.filter(
    (cat) => cat.type === "both" || cat.type === (editState.type ?? tx.type)
  );

  // Debug de categorias filtradas
  useEffect(() => {
    if (filteredCategories.length > 0) {
      console.log(
        `TransactionItem: ${
          filteredCategories.length
        } categorias filtradas para tipo ${editState.type ?? tx.type}`
      );
    }
  }, [filteredCategories.length, editState.type, tx.type]);

  // Função para remover o estado de edição

  // Função para remover o estado de edição
  function clearEditState() {
    setEditState({});
    setError(null);
  }
  // Função para salvar a edição na API
  async function saveChanges() {
    if (!isAuthenticated) {
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const result = await apiService.editTransaction({
        transactionCode: tx.code,
        newAmount:
          editState.amount !== undefined ? Number(editState.amount) : undefined,
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
  const deleteTransaction = async () => {
    try {
      setIsDeleting(true);
      const result = await apiService.deleteTransaction(tx.code);
      if (result.error) {
        toast.error(result.error);
      } else {
        if (onUpdate) {
          await onUpdate();
        }
        toast.success("Transação deletada com sucesso!");
      }
    } finally {
      setIsDeleting(false);
    }
  };
  const dateValue = editState.date
    ? new Date(editState.date)
    : tx.date
    ? new Date(tx.date)
    : undefined;
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
            <div className="font-medium text-gray-600 mb-1">
              {tx.description || "(Sem descrição)"}
            </div>
            <div className="text-xs text-gray-400">
              {dateOnly(tx.date)} •{" "}
              {categories.find((c) => c.value === tx.categoryCode)?.label ||
                categories.find(
                  (c) =>
                    c.value ===
                    (typeof tx.category === "string"
                      ? tx.category
                      : tx.category.code)
                )?.label ||
                (typeof tx.category === "object"
                  ? tx.category.name
                  : tx.category)}
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
              categories={filteredCategories}
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
          <div className="flex flex-col gap-3">
            <DatePicker
              date={dateValue}
              onDateChange={(date) =>
                setEditState((s) => ({
                  ...s,
                  date: date?.toISOString(),
                }))
              }
              placeholder="Escolha uma data"
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              type="submit"
              size="sm"
              disabled={isSaving || isDeleting}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Salvar
            </Button>

            <Button
              type="button"
              size="sm"
              className="flex-1"
              variant="secondary"
              onClick={clearEditState}
              disabled={isSaving || isDeleting}
            >
              <X className="size-4" />
              Cancelar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  variant="destructive"
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Deletar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Tem certeza que deseja deletar a transação?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Esta transação será
                    deletada permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isDeleting}
                    >
                      <X className="size-4" />
                      Cancelar
                    </Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild onClick={deleteTransaction}>
                    <Button variant="destructive" type="button" disabled={isDeleting}>
                      <Trash2 className="size-4" />
                      Deletar
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
        </form>
      </AccordionContent>
    </AccordionItem>
  );
}
