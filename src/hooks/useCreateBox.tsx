import { useApi } from "./useApi";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import type { CreateBoxRequest } from "@/services/api.interface";

export function useCreateBox() {
  const { apiService } = useApi();
  const { mutate } = useSWRConfig();

  const createBox = async (request: CreateBoxRequest) => {
    const result = await apiService.createBox(request);
    if (result.error) {
      toast.error(result.error);
      return null;
    }
    toast.success("Caixinha criada com sucesso");
    mutate("boxes");
    mutate("summary");
    return result.box;
  };

  return { createBox };
}
