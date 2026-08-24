import useSWR from "swr";
import { useApi } from "./useApi";
import type { ImportEntryStatus } from "@/services/api.interface";

type Params = {
  status?: ImportEntryStatus;
  page?: number;
  pageSize?: number;
};

export function useImportReview(batchId: string | null, params?: Params) {
  const { apiService, isAuthenticated } = useApi();

  const key =
    isAuthenticated && batchId
      ? ["import-review", batchId, params?.status ?? "", params?.page ?? 1, params?.pageSize ?? 25]
      : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => apiService.getImportReview(batchId!, params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
    }
  );

  return { review: data, error, isLoading, mutate };
}
