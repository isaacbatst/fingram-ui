import { createContext } from "react";
import type { ApiService } from "../../services/api.interface";

export interface ApiContextType {
  apiService: ApiService;
}

export const ApiContext = createContext<ApiContextType | null>(null);
