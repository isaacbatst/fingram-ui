import { planService } from "@/services/plan.service";
import useSWR from "swr";
import { useApi } from "./useApi";

export function usePlans() {
  const { isAuthenticated } = useApi();

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? "plans" : null,
    () => planService.getPlans(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  return { plans: data, error, isLoading, mutate };
}
