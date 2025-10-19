import useSWR from "swr";
import { useApi } from "./useApi";

export interface Category {
  id: string;
  name: string;
  code: string;
  transactionType: "income" | "expense" | "both";
  description?: string;
}

export function useCategories() {
  const { apiService, isAuthenticated } = useApi();
  
  return useSWR(isAuthenticated ? "categories" : null, async () => {
    return await apiService.getCategories();
  }, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });
}