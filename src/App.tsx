import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function getMockInitData() {
  return {
    user: {
      id: 12345678,
      first_name: "Isaac",
      username: "isaacbatst",
      photo_url: "",
    },
    chat: undefined,
    chat_instance: "some-instance-id",
  };
}

type InitData = {
  user?: {
    id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
  };
  chat?: { id: number; title: string };
  chat_instance: string;
};

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
};

const categorias = [
  { label: "Salário", value: "salario", type: "income" },
  { label: "Freelance", value: "freelance", type: "income" },
  { label: "Alimentação", value: "alimentacao", type: "expense" },
  { label: "Transporte", value: "transporte", type: "expense" },
  { label: "Lazer", value: "lazer", type: "expense" },
  { label: "Compras", value: "compras", type: "expense" },
];

export default function App() {
  const tg = useRef<any>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [ready, setReady] = useState(false);
  const [initData, setInitData] = useState<InitData | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const tgw = (window as any).Telegram?.WebApp;
      if (tgw) {
        tg.current = tgw;
        setIsTelegram(true);
        tg.current.ready();
        setInitData(tg.current.initDataUnsafe || getMockInitData());
        setReady(true);
      }
    };
    document.body.appendChild(script);
    const timeout = setTimeout(() => {
      if (!ready) {
        setInitData(getMockInitData());
        setReady(true);
      }
    }, 3000);
    return () => {
      clearTimeout(timeout);
      document.body.removeChild(script);
    };
    // eslint-disable-next-line
  }, []);

  const saldo = 3520.13;
  const receitas = 5050.25;
  const despesas = 1530.12;
  const orcamento = [
    { categoria: "Alimentação", valor: 800, usado: 670 },
    { categoria: "Transporte", valor: 300, usado: 220 },
    { categoria: "Lazer", valor: 400, usado: 120 },
  ];

  // Transações mock e adição
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx1",
      type: "income",
      amount: 2200,
      category: "salario",
      description: "Salário Junho",
      date: "2024-06-30",
    },
    {
      id: "tx2",
      type: "expense",
      amount: 89.9,
      category: "alimentacao",
      description: "iFood Pizza",
      date: "2024-07-08",
    },
    {
      id: "tx3",
      type: "expense",
      amount: 50,
      category: "transporte",
      description: "Uber para reunião",
      date: "2024-07-09",
    },
  ]);

  // Modal de formulário de transação
  const [showForm, setShowForm] = useState<false | "income" | "expense">(false);
  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // Filtros das transações
  const categoriaValues = categorias.map((c) => c.value);
  const [transFiltroData, setTransFiltroData] = useState<string>("");
  const [transFiltroCat, setTransFiltroCat] = useState<string>("");

  // Garante que o valor do filtro de categoria sempre exista
  useEffect(() => {
    if (transFiltroCat !== "" && !categoriaValues.includes(transFiltroCat)) {
      setTransFiltroCat("");
    }
  }, [transFiltroCat, categoriaValues]);

  function openForm(type: "income" | "expense") {
    setShowForm(type);
    setForm({
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
    });
  }

  function submitForm() {
    if (!form.amount || !form.category) return;
    setTransactions([
      ...transactions,
      {
        id: Math.random().toString(36).slice(2),
        type: showForm as "income" | "expense",
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        date: form.date,
      },
    ]);
    setShowForm(false);

    if (tg.current) {
      tg.current.sendData(
        JSON.stringify({
          action: showForm,
          ...form,
          chat_id: initData?.chat?.id || initData?.user?.id,
          user: initData?.user,
        })
      );
      tg.current.close();
    }
  }

  // Filtro efetivo
  const transFiltradas = transactions.filter((tx) => {
    if (transFiltroCat && tx.category !== transFiltroCat) return false;
    if (transFiltroData && tx.date !== transFiltroData) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-2">
      <div className="bg-white/90 rounded-3xl shadow-xl p-5 w-full max-w-sm mt-6 mb-4 border border-indigo-100">
        <div className="text-center mb-6">
          <div className="uppercase text-xs tracking-widest text-indigo-400 font-semibold mb-1">
            Saldo
          </div>
          <div className="text-4xl font-extrabold text-indigo-600 drop-shadow-sm mb-2">
            R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="flex justify-center mt-1 space-x-6 text-sm">
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <svg width="16" height="16" fill="none" className="inline">
                <path
                  d="M8 2v12M8 2l4 4M8 2L4 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              + R${" "}
              {receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-red-500 font-medium">
              <svg width="16" height="16" fill="none" className="inline">
                <path
                  d="M8 14V2M8 14l4-4M8 14l-4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              - R${" "}
              {despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Tabs: Orçamento / Transações */}
        <Tabs defaultValue="orcamento" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger className="w-1/2" value="orcamento">
              Orçamento
            </TabsTrigger>
            <TabsTrigger className="w-1/2" value="transacoes">
              Transações
            </TabsTrigger>
          </TabsList>
          <TabsContent value="orcamento">
            <div className="mb-2 font-semibold text-gray-700 text-base">
              Orçamento por categoria
            </div>
            <div className="space-y-4">
              {orcamento.map((c) => {
                const pct = Math.min(100, (c.usado / c.valor) * 100);
                return (
                  <div key={c.categoria}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-600">
                        {c.categoria}
                      </span>
                      <span className="text-xs text-gray-400">
                        R$ {c.usado}/{c.valor}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-3 rounded-full ${
                        pct > 90 ? "bg-red-200" : "bg-indigo-100"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>
          {/* Tab Transações */}
          <TabsContent value="transacoes">
            <div className="flex gap-2 mb-2">
              <Input
                type="date"
                className="max-w-[120px] text-xs"
                value={transFiltroData}
                onChange={(e) => setTransFiltroData(e.target.value)}
              />
              <Select onValueChange={setTransFiltroCat}>
                <SelectTrigger className="w-[180px]">
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
              {(transFiltroData || transFiltroCat) && (
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-1"
                  onClick={() => {
                    setTransFiltroData("");
                    setTransFiltroCat("");
                  }}
                >
                  <span className="text-lg">&times;</span>
                </Button>
              )}
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pb-2">
              {transFiltradas.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  Nenhuma transação encontrada
                </div>
              ) : (
                transFiltradas
                  .slice()
                  .reverse()
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-2 border-b pb-2 last:border-b-0"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          tx.type === "income" ? "bg-green-400" : "bg-red-400"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-700">
                          {tx.description || "(Sem descrição)"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tx.date} •{" "}
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
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Botões ação */}
        <div className="grid grid-cols-2 gap-4 mt-5">
          <Button
            variant="outline"
            className="w-full py-3 rounded-xl border-2 border-green-100 bg-green-50 hover:bg-green-100 transition"
            onClick={() => openForm("income")}
          >
            <span className="text-green-700 font-semibold flex items-center gap-1">
              <svg width="18" height="18" fill="none">
                <path
                  d="M9 3v12M9 3l4 4M9 3L5 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Receita
            </span>
          </Button>
          <Button
            variant="outline"
            className="w-full py-3 rounded-xl border-2 border-red-100 bg-red-50 hover:bg-red-100 transition"
            onClick={() => openForm("expense")}
          >
            <span className="text-red-700 font-semibold flex items-center gap-1">
              <svg width="18" height="18" fill="none">
                <path
                  d="M9 15V3M9 15l4-4M9 15l-4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Despesa
            </span>
          </Button>
        </div>

        {!isTelegram && ready && (
          <div className="mt-6 text-center text-gray-500 text-sm bg-yellow-50 border border-yellow-200 rounded-lg py-2 px-3">
            Abra este app pelo botão no Telegram!
          </div>
        )}
      </div>
      <div className="text-xs text-gray-300 mt-auto mb-2">
        Fingram &copy; 2024
      </div>

      {/* --- Modal de formulário de transação --- */}
      <Dialog
        open={!!showForm}
        onOpenChange={(open) => setShowForm(open ? showForm : false)}
      >
        <DialogContent className="max-w-xs rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>
              Nova {showForm === "income" ? "Receita" : "Despesa"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitForm();
            }}
          >
            <div>
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                min={0.01}
                step={0.01}
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={
                  categoriaValues.includes(form.category) ? form.category : ""
                }
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, category: val }))
                }
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Escolha..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias
                    .filter((c) => c.type === showForm)
                    .map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="(opcional)"
              />
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
