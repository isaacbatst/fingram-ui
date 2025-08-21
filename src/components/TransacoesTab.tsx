import { DateFilter } from "@/components/DateFilter";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/useTheme";
import { useTransactions } from "@/hooks/useTransactions";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Filter,
  X,
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
  category: string | {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  categoryCode?: string; // código da categoria para edição
  description: string;
  date: string;
};

type TransacoesTabProps = {
  categories: Category[];
  mutateSummary: () => void;
};

export function TransacoesTab({ categories, mutateSummary }: TransacoesTabProps) {
  const { getThemeColor } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState<number>(new Date().getFullYear());
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [filtroDescricao, setFiltroDescricao] = useState<string>("");
  // Usando o hook para buscar as transações
  const { data, isLoading, error, mutate: mutateTransactions } = useTransactions({
    page: currentPage,
    month: filtroMes,
    year: filtroAno,
    categoryId: filtroCategoria,
    description: filtroDescricao,
  });

  // Filtros das transações
  const [transFiltroDataRange, setTransFiltroDataRange] = useState<
    [string | null, string | null]
  >([null, null]);
  const [transFiltroCat, setTransFiltroCat] = useState<string>("");
  const [transFiltroNome, setTransFiltroNome] = useState("");

  // Determine se deve usar dados reais ou mock
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
        date: tx.createdAt.toString(),
      }))
    : [];
    
  console.log("TransacoesTab: Transactions mapeadas", transactions.length);

  return (
    <div>
      {data && (
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

          {data.totalPages > 1 && (
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
      )}

      {!data && (
        <Collapsible className="w-full mb-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-xs font-semibold bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-2"
            >
              <Filter />
              Filtros
              <span className="ml-2">
                <ChevronsUpDown />
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col gap-2 mt-2">
              <Input
                type="text"
                className="text-xs"
                placeholder="Buscar por nome..."
                value={transFiltroNome}
                onChange={(e) => setTransFiltroNome(e.target.value)}
              />
              <DateFilter
                value={transFiltroDataRange}
                onChange={setTransFiltroDataRange}
                theme={{
                  textColor: getThemeColor("text_color"),
                  hintColor: getThemeColor("hint_color"),
                  buttonColor: getThemeColor("button_color"),
                  accentColor: getThemeColor("accent_text_color"),
                }}
              />
              <Select onValueChange={setTransFiltroCat} value={transFiltroCat}>
                <SelectTrigger className="w-full text-xs">
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
              {(transFiltroDataRange[0] ||
                transFiltroDataRange[1] ||
                transFiltroCat ||
                transFiltroNome) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setTransFiltroDataRange([null, null]);
                    setTransFiltroCat("");
                    setTransFiltroNome("");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {isLoading && <LoadingSpinner />}

      {error && (
        <ErrorDisplay error={error} onRetry={() => mutateTransactions()} className="my-4" />
      )}

      <div className="space-y-3 pb-2">
        {!isLoading && !error && transactions.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            Nenhuma transação encontrada
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="w-full"
            animateContent={false}
          >
            {transactions
              .slice()
              .map((tx) => (
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
        )}
      </div>
    </div>
  );
}
