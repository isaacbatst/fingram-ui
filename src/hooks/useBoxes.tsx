import useSWR from "swr";
import { useApi } from "./useApi";

export function useBoxes() {
  const { apiService, isAuthenticated } = useApi();

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? "boxes" : null,
    () => apiService.getBoxes(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return { boxes: data, error, isLoading, mutate };
}
