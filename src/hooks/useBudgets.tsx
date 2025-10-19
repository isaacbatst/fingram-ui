import { useCallback } from "react";
import { toast } from "sonner";
import { useApi } from "./useApi";

interface Budget {
  categoryId: string;
  amount: number;
}

interface SetBudgetsResponse {
  success?: boolean;
  error?: string;
}

export const useBudgets = () => {
  const { apiService, isAuthenticated } = useApi();

  const setBudgets = useCallback(
    async (budgets: Budget[]): Promise<SetBudgetsResponse> => {
      if (!isAuthenticated) {
        return { error: "Usuário não autenticado" };
      }
      
      try {
        const response = await apiService.setBudgets(budgets);

        if (response.error) {
          return { error: response.error };
        }

        toast.success("Orçamentos definidos com sucesso!");
        return { success: true };
      } catch (error) {
        console.error("Erro ao definir orçamentos:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        return { error: errorMessage };
      }
    },
    [apiService]
  );

  return {
    setBudgets,
  };
};
