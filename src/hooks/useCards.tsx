import useSWR, { mutate as globalMutate } from "swr";
import { useApi } from "./useApi";

const swrOptions = { revalidateOnFocus: false, revalidateOnReconnect: true };

/**
 * Qualquer mudança em cartão, fatura, pagamento ou compra recalcula as linhas
 * derivadas no servidor: mexe em transações, saldos, orçamento e faturas de
 * uma vez. Tudo que foi carregado precisa ser relido.
 */
export function refreshAfterCardChange() {
  // Só o filtro: revalida mantendo o que está na tela. Passar `undefined` como
  // dado apagaria o cache (o resumo some e o app volta ao carregando).
  return globalMutate(() => true);
}

/** Cartões cadastrados, com o "a pagar" de cada um. */
export function useCards() {
  const { apiService, isAuthenticated } = useApi();
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? "cards" : null,
    () => apiService.getCards(),
    swrOptions,
  );
  return { cards: data ?? [], error, isLoading, mutate };
}

/** Faturas (todas, ou de um cartão) e extratos de cartão antigos ainda sem fatura. */
export function useInvoices(cardId?: string) {
  const { apiService, isAuthenticated } = useApi();
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? ["invoices", cardId ?? "all"] : null,
    () => apiService.getInvoices(cardId),
    swrOptions,
  );
  return {
    invoices: data?.invoices ?? [],
    pendingStatements: data?.pendingStatements ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useInvoiceDetail(invoiceId: string | null) {
  const { apiService, isAuthenticated } = useApi();
  return useSWR(
    isAuthenticated && invoiceId ? ["invoice", invoiceId] : null,
    () => apiService.getInvoice(invoiceId!),
    { ...swrOptions, shouldRetryOnError: false },
  );
}

export function useInvoiceReconcile(invoiceId: string | null) {
  const { apiService, isAuthenticated } = useApi();
  return useSWR(
    isAuthenticated && invoiceId ? ["invoice-reconcile", invoiceId] : null,
    () => apiService.getInvoiceReconcile(invoiceId!),
    { ...swrOptions, shouldRetryOnError: false },
  );
}

/** Saldo de cada estrato menos o "a pagar" dos cartões que ele paga. */
export function useAvailableBalance() {
  const { apiService, isAuthenticated } = useApi();
  return useSWR(
    isAuthenticated ? "available-balance" : null,
    () => apiService.getAvailableBalance(),
    swrOptions,
  );
}

/** Pares suspeitos: transação lançada à mão × compra importada do cartão. */
export function useDuplicates() {
  const { apiService, isAuthenticated } = useApi();
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? "invoice-duplicates" : null,
    () => apiService.getDuplicates(),
    swrOptions,
  );
  return { pairs: data?.pairs ?? [], error, isLoading, mutate };
}
