import { useMemo, type PropsWithChildren } from "react";
import { ApiContext } from "./context";
import { RealApiService } from "../../services/real-api.service";
import { StandaloneApiService } from "../../services/standalone-api.service";
import { useAuth } from "../../hooks/useAuth";
import { useTelegramContext } from "../../hooks/useTelegramContext";
import { mutate } from "swr";

export const ApiProvider = ({ children }: PropsWithChildren) => {
  const { sessionToken, vaultAccessToken, authMode } = useAuth();
  const { isTelegram, ready, webApp, initData } = useTelegramContext();

  const apiService = useMemo(() => {
    // Se ainda não está pronto, retorna null para evitar renderização prematura
    if (!ready) {
      console.log("API: Aguardando inicialização do contexto Telegram");
      return null;
    }
    
    // Use auth mode to determine which API service to use
    if (authMode === 'standalone') {
      if (vaultAccessToken) {
        console.log("API: Usando Standalone API com vault access token");
        return new StandaloneApiService(vaultAccessToken);
      } else {
        console.log("API: Modo standalone mas sem vault access token - retornando null");
        return null;
      }
    }
    
    // Telegram mode - use existing logic
    const isRealTelegram = 
      isTelegram && 
      !!webApp &&
      !!initData?.user?.id &&        // Verifica se temos um user ID válido
      !!webApp.initData &&           // Verifica se temos initData
      webApp.initData.length > 10;   // Garante que não é um initData vazio
    
    if (!isRealTelegram || !sessionToken) {
      console.log(`API: Não no ambiente Telegram válido ou sem session token - retornando null`);
      return null;
    }
    
    console.log("API: Usando API Real com ambiente Telegram confirmado");
    return new RealApiService(sessionToken);
  }, [authMode, sessionToken, vaultAccessToken, isTelegram, ready, webApp, initData]);

  // Update tokens in API services when they change
  useMemo(() => {
    if (apiService instanceof RealApiService) {
      apiService.updateSessionToken(sessionToken);
      mutate("summary"); // Refetch summary data on session token change
      mutate("categories"); // Refetch categories data on session token change
      mutate((key) => typeof key === 'string' ? key.startsWith("transactions") : false); // Refetch transactions data on session token change
    } else if (apiService instanceof StandaloneApiService) {
      apiService.updateAccessToken(vaultAccessToken);
      mutate("summary"); // Refetch summary data on vault access token change
      mutate("categories"); // Refetch categories data on vault access token change
      mutate((key) => typeof key === 'string' ? key.startsWith("transactions") : false); // Refetch transactions data on vault access token change
    }
  }, [apiService, sessionToken, vaultAccessToken]);

  // Don't render children if no API service is available
  if (!apiService) {
    return null;
  }

  return (
    <ApiContext.Provider value={{ apiService }}>
      {children}
    </ApiContext.Provider>
  );
};
