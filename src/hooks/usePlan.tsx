import { planService } from "@/services/plan.service";
import useSWR from "swr";
import { useApi } from "./useApi";

export function usePlan(id: string | null) {
  const { isAuthenticated } = useApi();

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated && id ? `plan-${id}` : null,
    () => planService.getPlan(id!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return { plan: data, error, isLoading, mutate };
}
