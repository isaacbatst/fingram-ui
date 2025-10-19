import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useTelegramContext } from "../../hooks/useTelegramContext";
import { useStorage } from "../../hooks/useStorage";
import { AuthContext } from "./context";

const SESSION_TOKEN_KEY = "fingram_session_token";
const VAULT_ACCESS_TOKEN_KEY = "fingram_vault_access_token";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

export type AuthMode = 'telegram' | 'standalone';

const AuthProvider = ({ children }: PropsWithChildren) => {
  const telegram = useTelegramContext();
  const storageService = useStorage();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [vaultAccessToken, setVaultAccessToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('telegram');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      if (authMode === 'telegram') {
        await storageService.removeItem(SESSION_TOKEN_KEY);
        setSessionToken(null);
      } else {
        await storageService.removeItem(VAULT_ACCESS_TOKEN_KEY);
        setVaultAccessToken(null);
      }
    } catch (err) {
      console.warn("Failed to remove token from storage:", err);
      // Continue with logout anyway - clear the state
      if (authMode === 'telegram') {
        setSessionToken(null);
      } else {
        setVaultAccessToken(null);
      }
    }
  }, [storageService, authMode]);

  const authenticateWithVaultToken = useCallback(async (accessToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/vault/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
        credentials: 'include', // Include cookies for HTTP-only authentication
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status}`);
      }

      const data = await response.json();
      
      // Store the access token
      try {
        await storageService.setItem(VAULT_ACCESS_TOKEN_KEY, accessToken);
      } catch (storageError) {
        console.warn("Failed to store vault access token in storage, but authentication succeeded:", storageError);
        // Continue anyway since the HTTP-only cookie is set
      }
      setVaultAccessToken(accessToken);
      setAuthMode('standalone');
      setIsLoading(false);
      
      return data;
    } catch (error) {
      console.error("Error during vault authentication:", error);
      setError("Token de acesso inválido. Verifique o token e tente novamente.");
      setIsLoading(false);
      throw error;
    }
  }, [storageService]);

  useEffect(() => {
    // Aguardar o Telegram tentar carregar primeiro
    if (!telegram.ready) {
      setIsLoading(true);
      return;
    }
    
    // Verificação robusta: deve ter TUDO funcionando para ser considerado Telegram válido
    const isValidTelegram = (() => {
      if (!telegram.isTelegram || !telegram.webApp) {
        return false;
      }
      
      // Tentar acessar initData para verificar se realmente funciona
      try {
        const initData = telegram.webApp.initData;
        return initData && initData.length > 0;
      } catch (error) {
        console.log("Telegram WebApp initData is not accessible:", error);
        return false;
      }
    })();
    
    if (!isValidTelegram) {
      // Fora do Telegram - check for existing vault access token
      const handleStandaloneAuthentication = async () => {
        try {
          const existingVaultToken = await storageService.getItem(VAULT_ACCESS_TOKEN_KEY);
          if (existingVaultToken && existingVaultToken !== "null") {
            setVaultAccessToken(existingVaultToken);
            setAuthMode('standalone');
            setIsLoading(false);
            setError(null);
            return;
          }
          
          // No existing token - user needs to provide one
          setAuthMode('standalone');
          setIsLoading(false);
          setError(null);
        } catch (error) {
          console.warn("Error checking vault access token from storage:", error);
          // Continue anyway - user can still authenticate with token input
          setAuthMode('standalone');
          setIsLoading(false);
          setError(null);
        }
      };
      
      handleStandaloneAuthentication();
      return;
    }

    // No Telegram VÁLIDO, tentar carregar token existente ou fazer exchange
    const handleTelegramAuthentication = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Tentar pegar token existente
        const existingToken = await storageService.getItem(SESSION_TOKEN_KEY);
        if (existingToken && existingToken !== "null") {
          setSessionToken(existingToken);
          setAuthMode('telegram');
          setIsLoading(false);
          return;
        }

        // Se não tem token, fazer exchange com o backend
        if (!telegram.webApp || !telegram.webApp.initData) {
          setError("Telegram WebApp or initData is not available");
          setIsLoading(false);
          return;
        }

        // Verificação adicional para garantir que initData está realmente disponível
        let initData: string;
        try {
          initData = telegram.webApp.initData;
          if (!initData || initData.length === 0) {
            throw new Error("initData is empty");
          }
        } catch (error) {
          setError("Failed to access Telegram initData: " + (error as Error).message);
          setIsLoading(false);
          return;
        }

        const exchangeUrl = `${API_BASE_URL}/miniapp/exchange?initData=${encodeURIComponent(initData)}`;

        const response = await fetch(exchangeUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to exchange init data on ${exchangeUrl}: ${response.status} ${await response.text()}`
          );
        }

        const data = await response.json();
        if (!data || !data.token) {
          throw new Error("No token received from the server");
        }

        // Salvar o novo token
        await storageService.setItem(SESSION_TOKEN_KEY, data.token);
        setSessionToken(data.token);
        setAuthMode('telegram');
        setIsLoading(false);
      } catch (error) {
        console.error("Error during authentication:", error);
        setError("Usuário não autenticado, gere um novo link de acesso no bot. " + (error as Error).message);
        setIsLoading(false);
      }
    };

    handleTelegramAuthentication();
  }, [telegram.ready, telegram.isTelegram, telegram.webApp, storageService]);

  return (
    <AuthContext.Provider value={{ 
      sessionToken, 
      vaultAccessToken,
      authMode,
      isLoading, 
      error, 
      logout,
      authenticateWithVaultToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
