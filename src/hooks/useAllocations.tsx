import { planService } from "@/services/plan.service";
import useSWR from "swr";
import { useApi } from "./useApi";

export function useAllocations() {
  const { isAuthenticated } = useApi();

  const { data } = useSWR(
    isAuthenticated ? "all-allocations" : null,
    () => planService.getAllocations(),
    {
      revalidateOnFocus: false,
    },
  );

  return { allocations: data ?? [] };
}
