import { planService } from "@/services/plan.service";
import useSWR from "swr";
import { useApi } from "./useApi";

export function usePaymentAllocations() {
  const { isAuthenticated } = useApi();

  const { data } = useSWR(
    isAuthenticated ? "payment-allocations" : null,
    () => planService.getAllocations("payment"),
    {
      revalidateOnFocus: false,
    },
  );

  return { allocations: data ?? [] };
}
