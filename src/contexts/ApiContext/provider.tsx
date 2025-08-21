import { useMemo, type PropsWithChildren } from "react";
import { ApiContext } from "./context";
import { RealApiService } from "../../services/real-api.service";
import { MockApiService } from "../../services/mock-api.service";
import { useAuth } from "../../hooks/useAuth";
import { useTelegramContext } from "../../hooks/useTelegramContext";

interface ApiProviderProps extends PropsWithChildren {
  useMockApi?: boolean;
}

export const ApiProvider = ({ children, useMockApi = false }: ApiProviderProps) => {
  const { sessionToken } = useAuth();
  const { isTelegram, ready, webApp, initData } = useTelegramContext();

  const apiService = useMemo(() => {
    // Se o useMockApi foi explicitamente definido como true, sempre use o mock
    if (useMockApi) {
      console.log("API: Usando Mock API por escolha explícita (useMockApi=true)");
      return new MockApiService();
    }
    
    // Se ainda não está pronto, espere antes de decidir
    if (!ready) {
      console.log("API: Usando Mock API temporariamente enquanto inicializa Telegram context");
      return new MockApiService(); // Temporário até decidir qual usar
    }
    
    // Verificações mais robustas para confirmar que estamos no ambiente Telegram
    const isRealTelegram = 
      isTelegram && 
      !!webApp &&
      !!initData?.user?.id &&        // Verifica se temos um user ID válido
      !!webApp.initData &&           // Verifica se temos initData
      webApp.initData.length > 10;   // Garante que não é um initData vazio
    
    const isMockSession = sessionToken === "mock-session-token" || !sessionToken;
    
    if (!isRealTelegram || isMockSession) {
      console.log(`API: Usando Mock API: ${!isRealTelegram ? 'Não no ambiente Telegram' : 'Sessão de mock'}`);
      return new MockApiService();
    }
    
    console.log("API: Usando API Real com ambiente Telegram confirmado");
    return new RealApiService(sessionToken);
  }, [useMockApi, isTelegram, sessionToken, ready, webApp, initData]);

  // Update session token in real API service when it changes
  useMemo(() => {
    if (apiService instanceof RealApiService) {
      apiService.updateSessionToken(sessionToken);
    }
  }, [apiService, sessionToken]);

  return (
    <ApiContext.Provider value={{ apiService }}>
      {children}
    </ApiContext.Provider>
  );
};
