import { useCallback } from "react";
import useSWR from "swr";
import type { Paginated } from "../utils/paginated";
import type { TransactionDTO } from "../utils/transaction.dto,";
import { useApi } from "./useApi";

export interface TransactionsParams {
  page?: number;
  year?: number;
  month?: number;
  categoryId?: string; // Adicionando filtro por categoria
  description?: string; // Adicionando filtro por descrição
}

export function useTransactions(params?: TransactionsParams) {
  const { apiService, isAuthenticated } = useApi();

  // Função para criar uma chave única baseada nos parâmetros
  const getKey = useCallback(() => {
    if (!isAuthenticated) return null;
    
    const keyParts = ["transactions"];
    if (params?.page) keyParts.push(`page:${params.page}`);
    if (params?.year && params?.month) keyParts.push(`date:${params.year}-${params.month}`);
    if (params?.categoryId) keyParts.push(`category:${params.categoryId}`);
    if (params?.description) keyParts.push(`desc:${params.description}`);
    
    return keyParts.join("|");
  }, [isAuthenticated, params]);

  // Função para buscar os dados das transações
  const fetcher = useCallback(
    async () => {
      return await apiService.getTransactions(params);
    },
    [apiService, params]
  );

  // Usando SWR para gerenciar o estado e buscar os dados
  return useSWR<Paginated<TransactionDTO>>(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });
}
