import { ErrorDisplay } from "@/components/ErrorDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OrcamentoTab } from "@/components/OrcamentoTab";
import { SaldoResumo } from "@/components/SaldoResumo";
import { TransacoesTab } from "@/components/TransacoesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "./components/ui/sonner";
import { useCategories } from "./hooks/useCategories";
import { useSummary } from "./hooks/useSummary";
import { useTelegramContext } from "./hooks/useTelegramContext";
import { useTheme } from "./hooks/useTheme";
import { cn } from "./lib/utils";
import AuthProvider from "./contexts/AuthContext/provider";
import { useAuth } from "./hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function AppContent() {
  const auth = useAuth();
  const { isTelegram, getThemeColor } = useTheme();
  const { ready } = useTelegramContext();
  const summary = useSummary();
  const categories = useCategories();

  const orcamento = summary.data?.budget?.map((b) => ({
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

  if (!auth.sessionToken && !auth.isLoading) {
    return (
      <ErrorDisplay
        error={
          auth.error ??
          "Usuário não autenticado. Gere um novo link de acesso no bot."
        }
        onRetry={() => window.location.reload()}
        className="max-w-md mx-auto mt-10"
      />
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col items-center",
        bgClass,
        textClass
      )}
    >
      {auth.sessionToken && (
        <div className="flex justify-end self-stretch p-5">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja sair? Você precisará gerar um novo link
                  de acesso no bot.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={auth.logout}>
                  Sair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="rounded-3xl shadow-xl p-5 w-full max-w-sm mb-4 border">
        {summary.isLoading && <LoadingSpinner />}

        {summary.error && (
          <ErrorDisplay
            error={summary.error.message}
            onRetry={summary.mutate}
            className="my-4"
          />
        )}

        {!summary.isLoading &&
          !summary.error &&
          summary.data &&
          summary.data.vault && (
            <>
              <SaldoResumo
                saldo={summary.data.vault.balance}
                receitas={summary.data.vault.totalIncomeAmount}
                despesas={summary.data.vault.totalSpentAmount}
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
                    mutateSummary={summary.mutate}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}

        {!summary.isLoading && !summary.error && !summary.data && ready && (
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
      <div className="text-xs mt-auto mb-2">Fingram &copy; {new Date().getFullYear()}</div>
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
      <TelegramProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
        <Toaster richColors />
      </TelegramProvider>
    </ErrorBoundary>
  );
}
