import { useCallback } from "react";
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

        return { success: true };
      } catch (error) {
        console.error("Erro ao definir orçamentos:", error);
        return { error: "Erro ao definir orçamentos" };
      }
    },
    [apiService, isAuthenticated]
  );

  return {
    setBudgets,
  };
};
