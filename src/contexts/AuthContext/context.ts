import { createContext } from "react";
export type AuthContextType = {
  sessionToken: string | null;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
