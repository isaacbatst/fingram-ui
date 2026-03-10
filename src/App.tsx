import { SpeedInsights } from "@vercel/speed-insights/react";
import { AccountButton } from "@/components/AccountButton";
import { AccentGlow } from "@/components/AccentGlow";
import { DunaLogo } from "@/components/DunaLogo";
import { GrainOverlay } from "@/components/GrainOverlay";
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
import type { LucideIcon } from "lucide-react";
import {
  ChartPie,
  DollarSign,
  MessageCircle,
  Search,
  TrendingUp,
  Wallet
} from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { CarteirasTab } from "./components/CarteirasTab";
import { IaTab } from "./components/IaTab";
import { PlanoTab } from "./components/PlanoTab";
import { Toaster } from "./components/ui/sonner";
import { useApi } from "./hooks/useApi";
import { useCategories } from "./hooks/useCategories";
import { useSearchParams } from "./hooks/useSearchParams";
import { useSummary } from "./hooks/useSummary";

const TAB_ITEMS: { value: string; icon: LucideIcon; label: string }[] = [
  { value: "ia", icon: MessageCircle, label: "IA" },
  { value: "input", icon: DollarSign, label: "Entrada" },
  { value: "carteiras", icon: Wallet, label: "Carteiras" },
  { value: "orcamento", icon: ChartPie, label: "Orçamento" },
  { value: "plano", icon: TrendingUp, label: "Plano" },
  { value: "transacoes", icon: Search, label: "Busca" },
];

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
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background text-foreground">
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
        <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-background text-foreground">
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

  const vault = summary.data?.vault;

  // Non-vault states (error, loading, empty)
  if (!vault) {
    return (
      <div className="h-dvh flex flex-col items-center bg-background text-foreground">
        <div className="flex justify-between items-center self-stretch px-5 py-2">
          <DunaLogo size={24} />
          <AccountButton />
        </div>
        <div className="min-h-0 sm:p-5 w-full flex flex-col flex-1 max-w-3xl mx-auto">
          {summary.error ? (
            <ErrorDisplay
              error={summary.error.message}
              onRetry={summary.mutate}
              className="my-4"
            />
          ) : summary.isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3 tracking-tight">
                Nenhum cofre encontrado
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                Use /create no bot do Telegram para criar um cofre.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col lg:flex-row bg-background text-foreground">
      <Tabs
        defaultValue={currentTab}
        className="flex-1 min-h-0 flex flex-col lg:flex-row"
        onValueChange={setCurrentTab}
      >
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-52 border-r border-[var(--color-border)] bg-background shrink-0">
          <div className="px-5 pt-5 pb-2">
            <DunaLogo size={28} showWordmark />
          </div>
          <TabsList className="flex flex-col items-stretch bg-transparent border-none rounded-none p-0 h-auto w-full mt-6">
            {TAB_ITEMS.map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="justify-start gap-3 px-5 py-2.5 h-auto border-t-0 border-l-2 border-transparent data-[state=active]:border-l-[var(--color-accent)] data-[state=active]:border-t-0 rounded-none text-sm"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-auto p-4">
            <AccountButton />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Mobile header */}
          <div className="lg:hidden flex justify-between items-center px-5 py-2">
            <DunaLogo size={24} />
            <AccountButton />
          </div>

          {/* Tab content area */}
          <div className="min-h-0 sm:p-5 w-full flex flex-col flex-1 max-w-3xl mx-auto">
            {!["ia", "plano"].includes(currentTab) && (
              <div className="px-4">
                <SaldoResumo
                  saldo={vault.balance}
                  receitas={vault.totalIncomeAmount}
                  despesas={vault.totalSpentAmount}
                />
              </div>
            )}
            <TabsContent value="ia" className="flex-1 flex flex-col min-h-0">
              <IaTab />
            </TabsContent>
            <TabsContent value="input" className="px-4">
              <InputTab />
            </TabsContent>
            <TabsContent
              value="carteiras"
              className="px-4 flex flex-col flex-1 min-h-0"
            >
              <CarteirasTab />
            </TabsContent>
            <TabsContent
              value="orcamento"
              className="px-4 flex flex-col flex-1 min-h-0"
            >
              <OrcamentoTab />
            </TabsContent>
            <TabsContent
              value="plano"
              className="px-4 flex flex-col flex-1 min-h-0"
            >
              <PlanoTab />
            </TabsContent>
            <TabsContent value="transacoes" className="px-4 flex flex-col flex-1 min-h-0">
              <TransacoesTab
                categories={categories.data || []}
                mutateSummary={summary.mutate}
              />
            </TabsContent>
          </div>

          {/* Mobile bottom bar */}
          <div className="lg:hidden flex">
            <TabsList className="flex-1 w-auto">
              {TAB_ITEMS.map(({ value, icon: Icon }) => (
                <TabsTrigger key={value} value={value}>
                  <Icon className="w-4 h-4" />
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>
      </Tabs>
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
      <Toaster closeButton style={{ zIndex: 10000 }} />
      <AccentGlow />
      <GrainOverlay />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
