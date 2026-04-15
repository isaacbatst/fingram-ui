import { useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { BudgetStartDaySchedule } from "@/lib/budget-period";
import { useApi } from "./useApi";

const EMPTY_SCHEDULE: BudgetStartDaySchedule = {
  defaultDay: 1,
  overrides: [],
};

export function useBudgetStartDay() {
  const { apiService, isAuthenticated } = useApi();

  const fetcher = useCallback(async () => {
    return await apiService.getBudgetStartDayConfig();
  }, [apiService]);

  const { data, isLoading, error, mutate } = useSWR(
    isAuthenticated ? "budget-start-day" : null,
    fetcher
  );

  const schedule: BudgetStartDaySchedule = data
    ? { defaultDay: data.defaultDay, overrides: data.overrides ?? [] }
    : EMPTY_SCHEDULE;

  const saveSchedule = useCallback(
    async (
      next: BudgetStartDaySchedule,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isAuthenticated) {
        return { success: false, error: "Usuário não autenticado" };
      }
      try {
        const response = await apiService.setBudgetStartDayConfig(next);
        if (response.error) {
          toast.error(response.error);
          return { success: false, error: response.error };
        }
        mutate();
        return { success: true };
      } catch (err) {
        console.error("Erro ao salvar configuração do dia de início:", err);
        const errorMessage = "Erro ao salvar configuração do dia de início";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [apiService, isAuthenticated, mutate]
  );

  return {
    schedule,
    defaultDay: schedule.defaultDay,
    overrides: schedule.overrides,
    isLoading,
    error,
    saveSchedule,
    mutate,
  };
}
