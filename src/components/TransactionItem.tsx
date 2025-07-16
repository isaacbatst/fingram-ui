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
import { useTelegramContext } from "@/hooks/useTelegramContext";
import { useState } from "react";
import type { Category } from "../hooks/useCategories";
import type { Transaction } from "./TransacoesTab";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

type TransactionItemProps = {
  transaction: Transaction;
  categorias?: Category[]; // Agora é opcional
  onUpdate?: () => Promise<void>;
};

export function TransactionItem({
  transaction: tx,
  categorias,
  onUpdate,
}: TransactionItemProps) {
  const { webApp: tg, ready } = useTelegramContext();
  // Estado para edição
  const [editState, setEditState] = useState<Partial<Transaction>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Converter categorias da API para o formato usado no componente
  const categories = categorias
    ? categorias.map((cat: Category) => ({
        label: cat.name,
        value: cat.code,
        type:
          cat.type === "both"
            ? (tx.type as "income" | "expense") // usar o tipo da transação atual
            : (cat.type as "income" | "expense"),
      }))
    : categorias || []; // fallback para as categorias passadas por props ou array vazio

  // Função para remover o estado de edição

  // Função para remover o estado de edição
  function clearEditState() {
    setEditState({});
    setError(null);
  }
  // Função para salvar a edição na API
  async function saveChanges() {
    if (!ready || !tg?.initDataUnsafe) {
      setError("O contexto do Telegram não está pronto.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Mostrar indicador de progresso no botão principal, se disponível
      if (tg?.MainButton) {
        tg.MainButton.showProgress();
      }

      const response = await fetch(
        `${API_BASE_URL}/miniapp/edit-transaction?initData=${encodeURIComponent(
          tg.initData
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionCode: tx.code,
            newAmount:
              editState.amount !== undefined
                ? Number(editState.amount)
                : undefined,
            newDate: editState.date,
            newCategory: editState.categoryCode,
            newDescription: editState.description,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao editar transação");
      }

      if (onUpdate) {
        await onUpdate();
      }

      clearEditState();
      toast.success("Transação editada com sucesso!", { closeButton: true });

      // Mostrar notificação de sucesso usando a API do Telegram
      if (tg?.MainButton) {
        tg.MainButton.hideProgress();
      }
    } catch (err) {
      console.error("Erro ao editar transação:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");

      // Desativar o botão de loading
      if (tg?.MainButton) {
        tg.MainButton.hideProgress();
      }
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
          <div className="flex gap-2">
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
            <Select
              value={editState.categoryCode ?? tx.categoryCode}
              onValueChange={(val) =>
                setEditState((s) => ({
                  ...s,
                  categoryCode: val,
                }))
              }
            >
              <SelectTrigger className="text-xs w-[120px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
