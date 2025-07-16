import { useCallback } from "react";
import { useTelegramContext } from "./useTelegramContext";
import useSWR from "swr";

export interface SummaryData {
  vaultId: string;
  chatId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function useSummary() {
  const { webApp: tg, ready } = useTelegramContext();

  // Função para buscar os dados do resumo
  const fetcher = useCallback(async (url: string) => {
    if (!ready || !tg || !tg.initData) {
      throw new Error('InitData não disponível');
    }

    const fetchUrl = new URL(url);
    fetchUrl.searchParams.append('initData', tg.initData);
    const response = await fetch(fetchUrl.toString());
    
    if(response.status === 401) {
      throw new Error('Gere um novo link de acesso no bot.');
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
    }

    const data = await response.json() as SummaryData;
    return data;
  }, [ready, tg]);

  // Usando SWR para gerenciar o estado e buscar os dados
  return useSWR(
    ready && tg ? `${API_BASE_URL}/miniapp/me` : null,
    fetcher,
  );
}
