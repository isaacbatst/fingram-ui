import type { SerializedVault } from "@/utils/vaultCalculations";
import { useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./useAuth";

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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function useSummary() {
  const { sessionToken } = useAuth();

  // Função para buscar os dados do resumo
  const fetcher = useCallback(
    async (url: string) => {
      if (!sessionToken) {
        throw new Error("Usuário não autenticado");
      }
      const fetchUrl = new URL(url);
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

      const data = (await response.json()) as SummaryData;
      return data;
    },
    [sessionToken]
  );

  // Usando SWR para gerenciar o estado e buscar os dados
  return useSWR(
    sessionToken ? `${API_BASE_URL}/miniapp/summary` : null,
    fetcher
  );
}
