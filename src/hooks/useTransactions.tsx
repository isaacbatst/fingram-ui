import { useCallback } from "react";
import useSWR from "swr";
import type { Paginated } from "../utils/paginated";
import type { TransactionDTO } from "../utils/transaction.dto,";
import { useTelegramContext } from "./useTelegramContext";


export interface TransactionsParams {
  page?: number;
  year?: number;
  month?: number;
  categoryId?: string; // Adicionando filtro por categoria
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function useTransactions(params?: TransactionsParams) {
  const { tg, ready } = useTelegramContext();

  // Função para construir a URL com os parâmetros
  const getUrl = useCallback(() => {
    if (!ready || !tg) return null;

    const url = new URL(`${API_BASE_URL}/miniapp/transactions`);
    if (params?.page) {
      url.searchParams.append('page', params.page.toString());
    }
    
    if (params?.year && params?.month) {
      url.searchParams.append('year', params.year.toString());
      url.searchParams.append('month', params.month.toString());
    }

    if (params?.categoryId) {
      url.searchParams.append('categoryId', params.categoryId);
    }
    
    return url.toString();
  }, [ready, tg, params]);

  // Função para buscar os dados das transações
  const fetcher = useCallback(async (url: string) => {
    if (!ready || !tg || !tg.initData) {
      throw new Error('InitData não disponível');
    }
    
    const fetchUrl = new URL(url);
    fetchUrl.searchParams.append('initData', tg.initData);

    const response = await fetch(fetchUrl.toString());
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
    }

    const data = await response.json() as Paginated<TransactionDTO>;
    return data;
  }, [ready, tg]);

  // Usando SWR para gerenciar o estado e buscar os dados
  return useSWR<Paginated<TransactionDTO>>(
    getUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
}
