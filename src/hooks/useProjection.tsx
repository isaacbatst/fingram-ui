import { planService } from "@/services/plan.service";
import useSWR from "swr";
import { useApi } from "./useApi";

export function useProjection(planId: string | null) {
  const { isAuthenticated } = useApi();

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated && planId ? `projection-${planId}` : null,
    () => planService.getProjection(planId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return { projection: data, error, isLoading, mutate };
}
