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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

const AuthProvider = ({ children }: PropsWithChildren) => {
  const telegram = useTelegramContext();
  const storageService = useStorage();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      await storageService.removeItem(SESSION_TOKEN_KEY);
      setSessionToken(null);
    } catch (err) {
      console.error("Failed to remove session token:", err);
      setError("Failed to remove session token");
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
      // Fora do Telegram ou Telegram inválido, usar mock authentication
      setSessionToken("mock-session-token");
      setIsLoading(false);
      setError(null);
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
    <AuthContext.Provider value={{ sessionToken, isLoading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
