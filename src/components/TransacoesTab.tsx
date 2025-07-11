import {
  Accordion,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DateFilter } from "@/components/DateFilter";
import { useTheme } from "@/hooks/useTheme";
import { ChevronsUpDown, Filter } from "lucide-react";
import { useState } from "react";

type Categoria = {
  label: string;
  value: string;
  type: "income" | "expense";
};

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
};

type TransacoesTabProps = {
  transactions: Transaction[];
  categorias: Categoria[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
};

export function TransacoesTab({ 
  transactions, 
  categorias, 
  setTransactions
}: TransacoesTabProps) {
  const { getThemeColor } = useTheme();
  // Filtros das transações
  const [transFiltroDataRange, setTransFiltroDataRange] = useState<[string | null, string | null]>([null, null]);
  const [transFiltroCat, setTransFiltroCat] = useState<string>("");
  const [transFiltroNome, setTransFiltroNome] = useState("");
  
  // Estado para edição
  const [editStates, setEditStates] = useState<
    Record<string, Partial<Transaction>>
  >({});

  // Filtro efetivo
  const transFiltradas = transactions.filter((tx) => {
    if (transFiltroCat && tx.category !== transFiltroCat) return false;
    if (
      transFiltroDataRange[0] &&
      new Date(tx.date) < new Date(transFiltroDataRange[0])
    )
      return false;
    if (
      transFiltroDataRange[1] &&
      new Date(tx.date) > new Date(transFiltroDataRange[1])
    )
      return false;
    if (
      transFiltroNome &&
      !tx.description.toLowerCase().includes(transFiltroNome.toLowerCase())
    )
      return false;
    return true;
  });

  // Função para remover o estado de edição de uma transação
  function clearEditState(id: string) {
    setEditStates((s) => {
      const copy = { ...s };
      delete copy[id];
      return copy;
    });
  }

  return (
    <div>
      <Collapsible className="w-full mb-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between text-xs font-semibold bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-2">
            <Filter />
            Filtros
            <span className="ml-2"><ChevronsUpDown /></span>
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
                {categorias.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(transFiltroDataRange[0] || transFiltroDataRange[1] || transFiltroCat || transFiltroNome) && (
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
      <div className="space-y-3 pb-2">
        {transFiltradas.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            Nenhuma transação encontrada
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full" animateContent={false}>
            {transFiltradas
              .slice()
              .reverse()
              .map((tx) => (
                <AccordionItem value={tx.id} key={tx.id}>
                  <AccordionTrigger className="py-2">
                    <div className="flex items-center gap-2 rounded px-1 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          tx.type === "income"
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-700">
                          {tx.description || "(Sem descrição)"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(tx.date).toLocaleDateString('pt-BR')} •{" "}
                          {categorias.find((c) => c.value === tx.category)
                            ?.label || tx.category}
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          tx.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
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
                        setTransactions((ts) =>
                          ts.map((t) =>
                            t.id === tx.id
                              ? {
                                  ...t,
                                  ...editStates[tx.id],
                                  amount:
                                    editStates[tx.id]?.amount !==
                                    undefined
                                      ? Number(editStates[tx.id]?.amount)
                                      : t.amount,
                                }
                              : t
                          )
                        );
                        clearEditState(tx.id);
                      }}
                    >
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          className="text-xs"
                          value={
                            editStates[tx.id]?.amount !== undefined
                              ? editStates[tx.id]?.amount
                              : tx.amount
                          }
                          onChange={(e) =>
                            setEditStates((s) => ({
                              ...s,
                              [tx.id]: {
                                ...s[tx.id],
                                amount: Number(e.target.value),
                              },
                            }))
                          }
                        />
                        <Select
                          value={
                            editStates[tx.id]?.category ?? tx.category
                          }
                          onValueChange={(val) =>
                            setEditStates((s) => ({
                              ...s,
                              [tx.id]: { ...s[tx.id], category: val },
                            }))
                          }
                        >
                          <SelectTrigger className="text-xs w-[120px]">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias
                              .filter((c) => c.type === tx.type)
                              .map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        className="text-xs"
                        value={
                          editStates[tx.id]?.description ?? tx.description
                        }
                        onChange={(e) =>
                          setEditStates((s) => ({
                            ...s,
                            [tx.id]: {
                              ...s[tx.id],
                              description: e.target.value,
                            },
                          }))
                        }
                        placeholder="Descrição"
                      />
                      <Input
                        type="date"
                        className="text-xs"
                        value={editStates[tx.id]?.date ?? tx.date}
                        onChange={(e) =>
                          setEditStates((s) => ({
                            ...s,
                            [tx.id]: {
                              ...s[tx.id],
                              date: e.target.value,
                            },
                          }))
                        }
                      />
                      <div className="flex gap-2 justify-end">
                        <Button type="submit" size="sm">
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => clearEditState(tx.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
