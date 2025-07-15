import useSWR from "swr";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface Category {
  id: string;
  name: string;
  code: string;
  type: "income" | "expense" | "both";
  description?: string;
} 

export function useCategories() {
  return useSWR(`${API_BASE_URL}/miniapp/categories`, async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
    }
    return response.json();
  }, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });
}
