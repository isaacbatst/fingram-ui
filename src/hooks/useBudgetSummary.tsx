import { useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function useBudgetSummary(year?: number, month?: number) {
  const { sessionToken } = useAuth();

  // Função para buscar os dados do resumo de orçamento
  const fetcher = useCallback(
    async (url: string) => {
      if (!sessionToken) {
        throw new Error("Usuário não autenticado");
      }
      const fetchUrl = new URL(url);
      
      // Adicionar parâmetros de query se fornecidos
      if (year && month) {
        fetchUrl.searchParams.set('year', year.toString());
        fetchUrl.searchParams.set('month', month.toString());
      }
      
      const response = await fetch(fetchUrl.toString(), {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (response.status === 401) {
        throw new Error("Gere um novo link de acesso no bot.");
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status}`);
      }

      const data = (await response.json()) as BudgetSummaryData;
      return data;
    },
    [sessionToken, year, month]
  );

  // Criar uma chave SWR que inclui os parâmetros de data
  const key = sessionToken 
    ? `${API_BASE_URL}/miniapp/summary${year && month ? `?year=${year}&month=${month}` : ''}`
    : null;

  return useSWR(key, fetcher);
}
