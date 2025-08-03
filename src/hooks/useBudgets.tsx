import { useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

interface Budget {
  categoryCode: string;
  amount: number;
}

interface SetBudgetsResponse {
  success?: boolean;
  error?: string;
}

export const useBudgets = () => {
  const { sessionToken } = useAuth();

  const setBudgets = useCallback(
    async (budgets: Budget[]): Promise<SetBudgetsResponse> => {
      if (!sessionToken) {
        return { error: "Token de sessão não encontrado" };
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/miniapp/set-budgets`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ budgets }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || "Erro ao definir orçamentos";
          return { error: errorMessage };
        }

        toast.success("Orçamentos definidos com sucesso!");
        return { success: true };
      } catch (error) {
        console.error("Erro ao definir orçamentos:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        return { error: errorMessage };
      }
    },
    [sessionToken]
  );

  return {
    setBudgets,
  };
};
