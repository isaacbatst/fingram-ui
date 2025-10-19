import { createContext } from "react";

export type AuthMode = 'telegram' | 'standalone';

export type AuthContextType = {
  sessionToken: string | null;
  vaultAccessToken: string | null;
  authMode: AuthMode;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
  authenticateWithVaultToken: (accessToken: string) => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
