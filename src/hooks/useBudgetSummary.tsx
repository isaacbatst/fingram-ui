import { useCallback } from "react";
import useSWR from "swr";
import { useApi } from "./useApi";
import type { SerializedVault } from "@/utils/vaultCalculations";

export interface BudgetSummaryData {
  vault: SerializedVault;
  budget: Array<{
    category: {
      id: string;
      name: string;
      code: string;
    };
    spent: number;
    amount: number;
    percentageUsed: number;
  }>;
  date: {
    year: number;
    month: number;
  };
}

export function useBudgetSummary(year?: number, month?: number) {
  const apiService = useApi();

  // Função para buscar os dados do resumo de orçamento
  const fetcher = useCallback(
    async () => {
      console.log("useBudgetSummary fetcher called", { year, month, apiService: apiService.constructor.name });
      return await apiService.getBudgetSummary(year, month);
    },
    [apiService, year, month]
  );

  // Criar uma chave SWR que inclui os parâmetros de data
  const key = apiService.isAuthenticated() 
    ? `budget-summary${year && month ? `|${year}-${month}` : ''}`
    : null;

  console.log("useBudgetSummary", { 
    key, 
    isAuthenticated: apiService.isAuthenticated(),
    apiService: apiService.constructor.name,
    year,
    month
  });

  return useSWR(key, fetcher);
}
