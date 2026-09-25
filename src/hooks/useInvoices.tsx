import useSWR from "swr";
import { useApi } from "./useApi";

/** Faturas de cartão e extratos de cartão ainda sem fatura. */
export function useInvoices() {
  const { apiService, isAuthenticated } = useApi();

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? "invoices" : null,
    () => apiService.getInvoices(),
    { revalidateOnFocus: false, revalidateOnReconnect: true },
  );

  return {
    invoices: data?.invoices ?? [],
    unlinkedStatements: data?.unlinkedStatements ?? [],
    error,
    isLoading,
    mutate,
  };
}
