import { ErrorDisplay } from "@/components/ErrorDisplay";
import { InputTab } from "@/components/InputTab";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OrcamentoTab } from "@/components/OrcamentoTab";
import { SaldoResumo } from "@/components/SaldoResumo";
import { TransacoesTab } from "@/components/TransacoesTab";
import { VaultAccessTokenInput } from "@/components/VaultAccessTokenInput";
import { TempTokenConfirmation } from "@/components/TempTokenConfirmation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageProvider } from "@/contexts/StorageContext/provider";
import { ApiProvider } from "@/contexts/ApiContext/provider";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "./components/ui/sonner";
import { useCategories } from "./hooks/useCategories";
import { useSummary } from "./hooks/useSummary";
import { useApi } from "./hooks/useApi";
import { AccountButton } from "@/components/AccountButton";
import { useSearchParams } from "./hooks/useSearchParams";

function AppContent() {
  const auth = useApi();
  const summary = useSummary();
  const categories = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("aba") || "input";
  const setCurrentTab = (tab: string) => {
    setSearchParams({ aba: tab });
  }

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
    <div className="min-h-screen flex flex-col items-center bg-white text-gray-900">
      {auth.isAuthenticated && (
        <div className="flex justify-end self-stretch p-5">
          <AccountButton />
        </div>
      )}

      <div className="rounded-3xl p-5 w-full sm:max-w-sm sm:shadow-xl sm:border">
        {summary.data && summary.data.vault ? (
          <>
            <SaldoResumo
              saldo={summary.data.vault.balance}
              receitas={summary.data.vault.totalIncomeAmount}
              despesas={summary.data.vault.totalSpentAmount}
            />

            {/* Tabs: Orçamento / Transações / Input */}
            <Tabs defaultValue={currentTab} className="w-full" onValueChange={setCurrentTab}>
              <TabsList className="w-full mb-4">
                <TabsTrigger className="w-1/3" value="input">
                  Registro
                </TabsTrigger>
                <TabsTrigger className="w-1/3" value="orcamento">
                  Orçamento
                </TabsTrigger>
                <TabsTrigger className="w-1/3" value="transacoes">
                  Transações
                </TabsTrigger>
              </TabsList>
              <TabsContent value="input">
                <InputTab />
              </TabsContent>
              <TabsContent value="orcamento">
                <OrcamentoTab />
              </TabsContent>
              {/* Tab Transações */}
              <TabsContent value="transacoes">
                <TransacoesTab
                  categories={categories.data || []}
                  mutateSummary={summary.mutate}
                />
              </TabsContent>
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
      <Toaster richColors />
    </ErrorBoundary>
  );
}
