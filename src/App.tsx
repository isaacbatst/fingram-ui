import { ErrorDisplay } from "@/components/ErrorDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OrcamentoTab } from "@/components/OrcamentoTab";
import { SaldoResumo } from "@/components/SaldoResumo";
import { TransacoesTab } from "@/components/TransacoesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useSummary } from "./hooks/useSummary";
import { useTelegramContext } from "./hooks/useTelegramContext";
import { useTheme } from "./hooks/useTheme";
import { useCategories } from "./hooks/useCategories";
import { cn } from "./lib/utils";
import { Toaster } from "./components/ui/sonner";

function AppContent() {
  const { isTelegram, getThemeColor } = useTheme();
  const { ready } = useTelegramContext();
  const {
    data: summaryData,
    isLoading: loading,
    error,
    mutate: refetch,
  } = useSummary();

  const saldo = summaryData?.vault.balance ?? 0;
  const receitas = summaryData?.vault.totalIncomeAmount ?? 0;
  const despesas = summaryData?.vault.totalSpentAmount ?? 0;
  const categories = useCategories();

  const orcamento = summaryData?.budget?.map((b) => ({
    categoria: b.category.name,
    valor: b.amount,
    usado: b.spent,
  })) ?? [
    { categoria: "Alimentação", valor: 800, usado: 670 },
    { categoria: "Transporte", valor: 300, usado: 220 },
    { categoria: "Lazer", valor: 400, usado: 120 },
  ];

  const bgClass = `bg-${getThemeColor("bg_color")}`;
  const textClass = `text-${getThemeColor("text_color")}`;

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col items-center p-2",
        bgClass,
        textClass
      )}
    >
      <div className="rounded-3xl shadow-xl p-5 w-full max-w-sm mt-6 mb-4 border">
        {loading && <LoadingSpinner />}

        {error && (
          <ErrorDisplay error={error} onRetry={refetch} className="my-4" />
        )}

        {!loading && !error && summaryData && (
          <>
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
                <OrcamentoTab orcamento={orcamento} />
              </TabsContent>
              {/* Tab Transações */}
              <TabsContent value="transacoes">
                <TransacoesTab
                  categories={categories.data || []}
                  mutateSummary={refetch}
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        {!loading && !error && !summaryData && ready && (
          <div className="text-center p-6">
            <div className="text-gray-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-sm">Nenhum cofre encontrado</p>
              <p className="text-xs text-gray-400 mt-1">
                Use /create no Telegram para criar um cofre
              </p>
            </div>
          </div>
        )}

        {!isTelegram && ready && (
          <div className="mt-6 text-center text-gray-500 text-sm bg-yellow-50 border border-yellow-200 rounded-lg py-2 px-3">
            Abra este app pelo botão no Telegram!
          </div>
        )}
      </div>
      <div className="text-xs mt-auto mb-2">Fingram &copy; 2024</div>
    </div>
  );
}

export default function App() {
  return (
    <TelegramProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
      <Toaster richColors />
    </TelegramProvider>
  );
}
