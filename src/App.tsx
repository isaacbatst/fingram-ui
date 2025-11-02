import { AccountButton } from "@/components/AccountButton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { InputTab } from "@/components/InputTab";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OrcamentoTab } from "@/components/OrcamentoTab";
import { SaldoResumo } from "@/components/SaldoResumo";
import { TempTokenConfirmation } from "@/components/TempTokenConfirmation";
import { TransacoesTab } from "@/components/TransacoesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VaultAccessTokenInput } from "@/components/VaultAccessTokenInput";
import { ApiProvider } from "@/contexts/ApiContext/provider";
import { StorageProvider } from "@/contexts/StorageContext/provider";
import {
  ChartPie,
  DollarSign,
  MessageCircle,
  Search
} from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { IaTab } from "./components/IaTab";
import { Toaster } from "./components/ui/sonner";
import { useApi } from "./hooks/useApi";
import { useCategories } from "./hooks/useCategories";
import { useSearchParams } from "./hooks/useSearchParams";
import { useSummary } from "./hooks/useSummary";

function AppContent() {
  const auth = useApi();
  const summary = useSummary();
  const categories = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("aba") || "input";
  const setCurrentTab = (tab: string) => {
    setSearchParams({ aba: tab });
  };

  // Mostrar loading enquanto a autenticação está carregando
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle authentication
  if (!auth.isLoading) {
    // Show temp token confirmation if there's a pending token
    if (auth.pendingTempToken) {
      return <TempTokenConfirmation />;
    }

    // Need authentication
    if (!auth.isAuthenticated) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-gray-900">
          <VaultAccessTokenInput />
        </div>
      );
    }

    // If we have an error and not authenticated, show error
    if (auth.error && !auth.isAuthenticated) {
      return (
        <ErrorDisplay
          error={auth.error}
          onRetry={() => window.location.reload()}
          className="max-w-md mx-auto mt-10"
        />
      );
    }
  }

  return (
    <div className="h-screen flex flex-col items-center bg-white text-gray-900">
      {auth.isAuthenticated && (
        <div className="flex justify-end self-stretch px-5 py-2">
          <AccountButton />
        </div>
      )}

      <div className="rounded-3xl min-h-0 sm:p-5 w-full flex flex-col flex-1 sm:max-w-md sm:shadow-xl sm:border">
        {summary.data && summary.data.vault ? (
          <>
            <Tabs
              defaultValue={currentTab}
              className="flex-1 min-h-0 w-full"
              onValueChange={setCurrentTab}
            >
              <TabsContent value="ia" className="flex-1 flex flex-col min-h-0">
                <IaTab />
              </TabsContent>
              <TabsContent value="input" className="px-4">
                <SaldoResumo
                  saldo={summary.data.vault.balance}
                  receitas={summary.data.vault.totalIncomeAmount}
                  despesas={summary.data.vault.totalSpentAmount}
                />
                <InputTab />
              </TabsContent>
              <TabsContent
                value="orcamento"
                className="px-4 flex flex-col flex-1 min-h-0"
              >
                <SaldoResumo
                  saldo={summary.data.vault.balance}
                  receitas={summary.data.vault.totalIncomeAmount}
                  despesas={summary.data.vault.totalSpentAmount}
                />
                <OrcamentoTab />
              </TabsContent>
              {/* Tab Transações */}
              <TabsContent value="transacoes" className="px-4">
                <SaldoResumo
                  saldo={summary.data.vault.balance}
                  receitas={summary.data.vault.totalIncomeAmount}
                  despesas={summary.data.vault.totalSpentAmount}
                />
                <TransacoesTab
                  categories={categories.data || []}
                  mutateSummary={summary.mutate}
                />
              </TabsContent>
              <div className="flex">
                <TabsList className="flex-1 w-auto">
                  <TabsTrigger value="ia">
                    <MessageCircle className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="input">
                    <DollarSign className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="orcamento">
                    <ChartPie className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="transacoes">
                    <Search className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </>
        ) : summary.error ? (
          <ErrorDisplay
            error={summary.error.message}
            onRetry={summary.mutate}
            className="my-4"
          />
        ) : summary.isLoading ? (
          <LoadingSpinner />
        ) : (
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
                Use /create no bot para criar um cofre
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorDisplay
          error={`${error.message} ${error.stack}`}
          onRetry={() => {
            resetErrorBoundary();
            window.location.reload();
          }}
          className="max-w-md mx-auto mt-10"
        />
      )}
    >
      <StorageProvider>
        <ApiProvider>
          <AppContent />
        </ApiProvider>
      </StorageProvider>
      <Toaster closeButton richColors />
    </ErrorBoundary>
  );
}
