import { useCallback } from "react";
import { useApi } from "./useApi";
import type { CreateTransactionRequest, CreateTransactionResponse } from "../services/api.interface";
import { mutate } from "swr";

export function useCreateTransaction() {
  const { apiService, isAuthenticated } = useApi();

  const createTransaction = useCallback(
    async (request: CreateTransactionRequest): Promise<CreateTransactionResponse> => {
      if (!isAuthenticated) {
        return { error: "Usuário não autenticado" };
      }

      try {
        const result = await apiService.createTransaction(request);
        
        // Invalidate and refetch related data
        mutate("summary");
        mutate((key) => typeof key === 'string' ? key.startsWith("transactions") : false);
        
        return result;
      } catch (error) {
        console.error("Erro ao criar transação:", error);
        return { 
          error: error instanceof Error ? error.message : "Erro ao criar transação" 
        };
      }
    },
    [apiService]
  );

  return { createTransaction };
}
