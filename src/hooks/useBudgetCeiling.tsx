import useSWR from "swr";
import { useApi } from "./useApi";
import type { BudgetCeilingData } from "@/services/api.interface";

export function useBudgetCeiling() {
  const { apiService, isAuthenticated } = useApi();

  const { data, error, isLoading } = useSWR<BudgetCeilingData>(
    isAuthenticated ? 'budget-ceiling' : null,
    () => apiService.getBudgetCeiling(),
  );

  return { ceiling: data ?? null, isLoading, error };
}
