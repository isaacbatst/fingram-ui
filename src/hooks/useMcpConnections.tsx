import useSWR from "swr";
import { useApi } from "./useApi";
import type { McpConnection } from "@/services/api.interface";

export function useMcpConnections() {
  const { apiService, isAuthenticated } = useApi();

  const { data, error, isLoading, mutate } = useSWR<McpConnection[]>(
    isAuthenticated ? "mcp-connections" : null,
    () => apiService.getMcpConnections(),
  );

  const revoke = async (clientId: string) => {
    await apiService.revokeMcpConnection(clientId);
    await mutate();
  };

  return { connections: data ?? [], isLoading, error, revoke };
}
