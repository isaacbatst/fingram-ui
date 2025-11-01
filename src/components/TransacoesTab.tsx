import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions } from "@/hooks/useTransactions";
import {
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { useState } from "react";
import type { Category } from "../hooks/useCategories";
import { ErrorDisplay } from "./ErrorDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { TransactionItem } from "./TransactionItem";

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
  categoryCode?: string; // código da categoria para edição
  description: string;
  createdAt: string;
  date: string;
};

type TransacoesTabProps = {
  categories: Category[];
  mutateSummary: () => void;
};

export function TransacoesTab({
  categories,
  mutateSummary,
}: TransacoesTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState<number>(new Date().getFullYear());
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [filtroDescricao, setFiltroDescricao] = useState<string>("");
  // Usando o hook para buscar as transações
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
  });

  const transactions = data?.items
    ? data.items.map((tx) => ({
        id: tx.id,
        code: tx.code,
        type: tx.type,
        amount: Math.abs(tx.amount),
        // Preserva o objeto completo da categoria para termos todos os dados disponíveis
        category: tx.category || "",
        // Mantém o categoryCode para compatibilidade
        categoryCode: tx.category?.code || "",
        description: tx.description || "",
        date: tx.date.toString(),
        createdAt: tx.createdAt.toString(),
      }))
    : [];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2">
        <Select
          value={`${filtroAno}-${filtroMes.toString().padStart(2, "0")}`}
          onValueChange={(val) => {
            const [year, month] = val.split("-").map(Number);
            setFiltroAno(year);
            setFiltroMes(month);
            setCurrentPage(1); // Reset para a primeira página
          }}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              const monthName = new Date(2000, i, 1).toLocaleString("pt-BR", {
                month: "long",
              });
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
        <div className="flex">
          <Select
            value={filtroCategoria}
            onValueChange={(val) => {
              setFiltroCategoria(val);
              setCurrentPage(1); // Reset para a primeira página
              mutateTransactions(); // Recarrega as transações com o novo filtro
            }}
          >
            <SelectTrigger className="text-xs flex-1">
              <SelectValue placeholder="Todas categorias" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* clear button */}
          <Button
            variant="outline"
            size="icon"
            className="ml-2"
            onClick={() => {
              setFiltroCategoria("");
              mutateTransactions(); // Recarrega as transações com os filtros resetados
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex">
          <Input
            type="text"
            className="text-xs flex-1"
            placeholder="Buscar por descrição..."
            value={filtroDescricao}
            onChange={(e) => setFiltroDescricao(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCurrentPage(1);
                mutateTransactions();
              }
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="ml-2"
            onClick={() => {
              setFiltroDescricao("");
              mutateTransactions();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              {currentPage} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= data.totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(data.totalPages, p + 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 pb-2">
        {data && data.items.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            Nenhuma transação encontrada
          </div>
        ) : data && data.items.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            className="w-full"
            animateContent={false}
          >
            {transactions.slice().map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                categorias={categories}
                onUpdate={async () => {
                  await Promise.allSettled([
                    mutateTransactions(),
                    mutateSummary(),
                  ]);
                }}
              />
            ))}
          </Accordion>
        ) : error ? (
          <ErrorDisplay
            error={error.message}
            onRetry={mutateTransactions}
            className="my-4"
          />
        ) : isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="text-gray-400 text-center py-8">
            Nenhuma transação encontrada
          </div>
        )}
      </div>
    </div>
  );
}
