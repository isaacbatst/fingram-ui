import { useCallback } from "react";
import useSWR from "swr";
import type { Paginated } from "../utils/paginated";
import type { TransactionDTO } from "../utils/transaction.dto,";
import { useAuth } from "./useAuth";

export interface TransactionsParams {
  page?: number;
  year?: number;
  month?: number;
  categoryId?: string; // Adicionando filtro por categoria
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function useTransactions(params?: TransactionsParams) {
  const { sessionToken } = useAuth();

  // Função para construir a URL com os parâmetros
  const getUrl = useCallback(() => {
    const url = new URL(`${API_BASE_URL}/miniapp/transactions`);
    if (params?.page) {
      url.searchParams.append("page", params.page.toString());
    }

    if (params?.year && params?.month) {
      url.searchParams.append("year", params.year.toString());
      url.searchParams.append("month", params.month.toString());
    }

    if (params?.categoryId) {
      url.searchParams.append("categoryId", params.categoryId);
    }

    return url.toString();
  }, [params]);

  // Função para buscar os dados das transações
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
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status}`);
      }

      const data = (await response.json()) as Paginated<TransactionDTO>;
      return data;
    },
    [sessionToken]
  );

  // Usando SWR para gerenciar o estado e buscar os dados
  return useSWR<Paginated<TransactionDTO>>(getUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });
}
