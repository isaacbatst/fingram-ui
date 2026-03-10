import { useApi } from "./useApi";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import type { CreateTransferRequest, EditTransferRequest } from "@/services/api.interface";

export function useTransfer() {
  const { apiService } = useApi();
  const { mutate } = useSWRConfig();

  const invalidateAll = () => {
    mutate("boxes");
    mutate("summary");
    mutate((key: unknown) => typeof key === 'string' ? key.startsWith("transactions") : false);
    mutate((key: unknown) => typeof key === 'string' ? key.startsWith("budget-summary") : false);
  };

  const createTransfer = async (request: CreateTransferRequest) => {
    const result = await apiService.createTransfer(request);
    if (result.error) {
      toast.error(result.error);
      return null;
    }
    invalidateAll();
    return result.transferId;
  };

  const editTransfer = async (request: EditTransferRequest) => {
    const result = await apiService.editTransfer(request);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    invalidateAll();
    return true;
  };

  const deleteTransfer = async (transferId: string) => {
    const result = await apiService.deleteTransfer(transferId);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    invalidateAll();
    return true;
  };

  return { createTransfer, editTransfer, deleteTransfer };
}
