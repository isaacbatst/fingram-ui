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
import { ArrowRight, ArrowRightLeft, Check, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BoxDTO } from "../services/api.interface";
import { useApi } from "../hooks/useApi";
import type { Category } from "../hooks/useCategories";
import { useTransfer } from "../hooks/useTransfer";
import { CategorySelect } from "./CategorySelect";
import { DatePicker } from "./DatePicker";
import type { Transaction } from "./TransacoesTab";
import { format } from "date-fns";
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

const parseDateLocal = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day);
};

function TransferEditForm({
  tx,
  boxes,
  onUpdate,
  dateValue,
}: {
  tx: Transaction;
  boxes?: BoxDTO[];
  onUpdate?: () => Promise<void>;
  dateValue?: Date;
}) {
  const { editTransfer, deleteTransfer } = useTransfer();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editState, setEditState] = useState<{
    amount?: number;
    date?: string;
    fromBoxId?: string;
    toBoxId?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);

  const currentFromBoxId = editState.fromBoxId ?? tx.boxId;
  const currentToBoxId = editState.toBoxId ?? tx.transferToBoxId ?? "";
  const editDateValue = editState.date
    ? parseDateLocal(editState.date)
    : dateValue;

  const saveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const success = await editTransfer({
        transferId: tx.transferId!,
        amount: editState.amount,
        date: editState.date,
        fromBoxId: editState.fromBoxId,
        toBoxId: editState.toBoxId,
      });
      if (success) {
        if (onUpdate) await onUpdate();
        setEditState({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteTransfer(tx.transferId!);
      if (success && onUpdate) await onUpdate();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      className="space-y-2 rounded p-2"
      onSubmit={(e) => {
        e.preventDefault();
        saveChanges();
      }}
    >
      <div className="flex gap-2 mb-2">
        <Input
          type="number"
          min={0.01}
          step={0.01}
          className="text-xs"
          value={editState.amount !== undefined ? editState.amount : tx.amount}
          onChange={(e) =>
            setEditState((s) => ({ ...s, amount: Number(e.target.value) }))
          }
        />
      </div>
      {boxes && boxes.length > 0 && (
        <div className="flex gap-2 items-center">
          <Select
            value={currentFromBoxId}
            onValueChange={(val) => setEditState((s) => ({ ...s, fromBoxId: val }))}
          >
            <SelectTrigger className="text-xs flex-1">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              {boxes.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
          <Select
            value={currentToBoxId}
            onValueChange={(val) => setEditState((s) => ({ ...s, toBoxId: val }))}
          >
            <SelectTrigger className="text-xs flex-1">
              <SelectValue placeholder="Destino" />
            </SelectTrigger>
            <SelectContent>
              {boxes.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <DatePicker
          date={editDateValue}
          onDateChange={(date) =>
            setEditState((s) => ({ ...s, date: date ? format(date, 'yyyy-MM-dd') : undefined }))
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
          onClick={() => { setEditState({}); setError(null); }}
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
                Tem certeza que deseja deletar a transferencia?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta acao nao pode ser desfeita. Esta transferencia sera
                deletada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button type="button" variant="secondary" disabled={isDeleting}>
                  <X className="size-4" />
                  Cancelar
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild onClick={handleDelete}>
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
  );
}

type TransactionItemProps = {
  transaction: Transaction;
  categorias?: Category[]; // Agora é opcional
  boxes?: BoxDTO[];
  onUpdate?: () => Promise<void>;
};

const dateOnly = (date: string) => {
  return date.split("T")[0].split("-").reverse().join("/");
};

export function TransactionItem({
  transaction: txOriginal,
  categorias,
  boxes,
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

  const isTransfer = tx.transferId != null;
  const boxName = boxes?.find((b) => b.id === tx.boxId)?.name;
  const transferToBoxName = tx.transferToBoxId
    ? boxes?.find((b) => b.id === tx.transferToBoxId)?.name
    : undefined;
  const isCompletePair = isTransfer && tx.transferToBoxId != null;

  const transferLabel = (() => {
    if (!isTransfer) return null;
    if (isCompletePair) return { from: boxName ?? "?", to: transferToBoxName ?? "?" };
    if (tx.type === "expense") return { from: boxName ?? "?", to: null };
    return { from: null, to: boxName ?? "?" };
  })();

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
        newBoxId: editState.boxId,
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
    ? parseDateLocal(editState.date)
    : tx.date
    ? parseDateLocal(tx.date)
    : undefined;
  return (
    <AccordionItem value={tx.id} key={tx.id}>
      <AccordionTrigger className="py-2 min-w-0">
        <div className="flex items-center gap-2 rounded px-1 flex-1 min-w-0 text-base">
          {isTransfer ? (
            <ArrowRightLeft className="w-4 h-4 text-blue-500 shrink-0" />
          ) : (
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                tx.type === "income" ? "bg-green-400" : "bg-red-400"
              }`}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-600 mb-1 flex items-center min-w-0">
              {isTransfer && transferLabel ? (
                <>
                  {transferLabel.from && (
                    <span className="truncate">{transferLabel.from}</span>
                  )}
                  <ArrowRight className="w-3 h-3 text-blue-400 shrink-0 mx-1" />
                  {transferLabel.to && (
                    <span className="truncate">{transferLabel.to}</span>
                  )}
                </>
              ) : (
                <span className="truncate">{tx.description || "(Sem descrição)"}</span>
              )}
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
              <span className="shrink-0">{dateOnly(tx.date)}</span>
              {isTransfer && (
                <span className="inline-flex items-center rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-600 whitespace-nowrap ring-1 ring-blue-200/60 shrink-0">
                  Transferencia
                </span>
              )}
              {!isTransfer && (
                <span className="truncate">
                  •{" "}
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
                  {boxName && !isCompletePair && ` • ${boxName}`}
                </span>
              )}
            </div>
          </div>
          <div
            className={`font-semibold whitespace-nowrap ${
              isTransfer
                ? "text-blue-600"
                : tx.type === "income"
                  ? "text-green-600"
                  : "text-red-600"
            }`}
          >
            {!isCompletePair && (tx.type === "income" ? "+" : "-")}{" "}
            R${" "}
            {tx.amount.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {isTransfer ? (
          <TransferEditForm
            tx={tx}
            boxes={boxes}
            onUpdate={onUpdate}
            dateValue={dateValue}
          />
        ) : (
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
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
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
            {boxes && boxes.length > 0 && (
              <div className="flex gap-2">
                <Select
                  value={editState.boxId ?? tx.boxId ?? ""}
                  onValueChange={(val) =>
                    setEditState((s) => ({ ...s, boxId: val }))
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Caixinha" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <DatePicker
                date={dateValue}
                onDateChange={(date) =>
                  setEditState((s) => ({
                    ...s,
                    date: date ? format(date, 'yyyy-MM-dd') : undefined,
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
                      Tem certeza que deseja deletar a transacao?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acao nao pode ser desfeita. Esta transacao sera
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
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
