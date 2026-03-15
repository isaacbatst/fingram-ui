import { planService, type CreatePlanRequest } from "@/services/plan.service";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export function useCreatePlan() {
  const [isLoading, setIsLoading] = useState(false);

  const createPlan = useCallback(async (data: CreatePlanRequest) => {
    setIsLoading(true);
    try {
      const plan = await planService.createPlan(data);
      mutate("plans");
      return plan;
    } catch {
      toast.error("Erro ao criar plano");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createPlan, isLoading };
}
