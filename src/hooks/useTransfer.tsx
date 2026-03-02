import { useApi } from "./useApi";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import type { CreateTransferRequest } from "@/services/api.interface";

export function useTransfer() {
  const { apiService } = useApi();
  const { mutate } = useSWRConfig();

  const createTransfer = async (request: CreateTransferRequest) => {
    const result = await apiService.createTransfer(request);
    if (result.error) {
      toast.error(result.error);
      return null;
    }
    toast.success("Transferência realizada com sucesso");
    mutate("boxes");
    mutate("summary");
    return result.transferId;
  };

  const deleteTransfer = async (transferId: string) => {
    const result = await apiService.deleteTransfer(transferId);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    toast.success("Transferência removida");
    mutate("boxes");
    mutate("summary");
    return true;
  };

  return { createTransfer, deleteTransfer };
}
