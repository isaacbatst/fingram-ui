import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useState } from "react";
import { OrcamentoTab } from "@/components/OrcamentoTab";
import { TransacoesTab } from "@/components/TransacoesTab";
import { SaldoResumo } from "@/components/SaldoResumo";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { useTheme } from "./hooks/useTheme";
import { useTelegramContext } from "./hooks/useTelegramContext";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
};

const categorias = [
  { label: "Salário", value: "salario", type: "income" as const },
  { label: "Freelance", value: "freelance", type: "income" as const },
  { label: "Alimentação", value: "alimentacao", type: "expense" as const },
  { label: "Transporte", value: "transporte", type: "expense" as const },
  { label: "Lazer", value: "lazer", type: "expense" as const },
  { label: "Compras", value: "compras", type: "expense" as const },
];

function AppContent() {
  const { isTelegram } = useTheme();
  const { ready } = useTelegramContext();

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

  return (
    <div
      className="min-h-screen flex flex-col items-center p-2"
    >
      <div
        className="rounded-3xl shadow-xl p-5 w-full max-w-sm mt-6 mb-4 border"
      >
        <SaldoResumo
          saldo={saldo}
          receitas={receitas}
          despesas={despesas}
        />

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
            <OrcamentoTab 
              orcamento={orcamento}
            />
          </TabsContent>
          {/* Tab Transações */}
          <TabsContent value="transacoes">
            <TransacoesTab 
              transactions={transactions}
              categorias={categorias}
              setTransactions={setTransactions}
            />
          </TabsContent>
        </Tabs>

        {!isTelegram && ready && (
          <div className="mt-6 text-center text-gray-500 text-sm bg-yellow-50 border border-yellow-200 rounded-lg py-2 px-3">
            Abra este app pelo botão no Telegram!
          </div>
        )}
      </div>
      <div className="text-xs mt-auto mb-2">
        Fingram &copy; 2024
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TelegramProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </TelegramProvider>
  );
}
