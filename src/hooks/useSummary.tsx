import type { SerializedVault } from "@/utils/vaultCalculations";
import { useCallback } from "react";
import useSWR from "swr";
import { useApi } from "./useApi";

export interface SummaryData {
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

export function useSummary() {
  const { apiService, isAuthenticated } = useApi();

  // Função para buscar os dados do resumo
  const fetcher = useCallback(
    async () => {
      return await apiService.getSummary();
    },
    [apiService]
  );

  // Usando SWR para gerenciar o estado e buscar os dados
  return useSWR(
    isAuthenticated ? "summary" : null,
    fetcher
  );
}
