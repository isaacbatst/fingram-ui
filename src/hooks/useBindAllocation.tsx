import { useState, useCallback } from 'react';
import { planService } from '@/services/plan.service';
import { toast } from 'sonner';
import { mutate } from 'swr';

export function useBindAllocation(planId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const bind = useCallback(
    async (allocationId: string, estratoId: string | null) => {
      setIsLoading(true);
      try {
        await planService.bindAllocation(planId, allocationId, estratoId);
        await mutate(`plan-${planId}`);
      } catch {
        toast.error('Erro ao vincular estrato');
      } finally {
        setIsLoading(false);
      }
    },
    [planId],
  );

  return { bind, isLoading };
}
