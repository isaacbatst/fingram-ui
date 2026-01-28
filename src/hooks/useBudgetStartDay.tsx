import { useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { useApi } from "./useApi";

export function useBudgetStartDay() {
  const { apiService, isAuthenticated } = useApi();

  // Fetcher for getting budget start day
  const fetcher = useCallback(async () => {
    return await apiService.getBudgetStartDay();
  }, [apiService]);

  // SWR for fetching budget start day
  const { data, isLoading, error, mutate } = useSWR(
    isAuthenticated ? "budget-start-day" : null,
    fetcher
  );

  // Function to set budget start day
  const setBudgetStartDay = useCallback(
    async (day: number): Promise<{ success: boolean; error?: string }> => {
      if (!isAuthenticated) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        const response = await apiService.setBudgetStartDay(day);

        if (response.error) {
          toast.error(response.error);
          return { success: false, error: response.error };
        }

        toast.success("Dia de início do orçamento atualizado!");
        // Revalidate the data
        mutate();
        return { success: true };
      } catch (error) {
        console.error("Erro ao definir dia de início do orçamento:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erro interno";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [apiService, isAuthenticated, mutate]
  );

  return {
    budgetStartDay: data?.budgetStartDay ?? 1,
    isLoading,
    error,
    setBudgetStartDay,
    mutate,
  };
}
