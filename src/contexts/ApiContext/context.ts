import { createContext } from "react";
import type { ApiService } from "../../services/api.interface";

export interface ApiContextType {
  apiService: ApiService;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
  authenticateWithVaultToken: (accessToken: string) => Promise<void>;
  authenticateWithTempToken: (tempToken: string) => Promise<void>;
  pendingTempToken: string | null;
  confirmTempTokenExchange: () => Promise<void>;
  dismissTempToken: () => void;
  refreshAuth: () => Promise<void>;
}

export const ApiContext = createContext<ApiContextType | null>(null);
