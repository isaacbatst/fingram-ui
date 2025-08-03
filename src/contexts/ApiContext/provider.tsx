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
  const { isTelegram, ready } = useTelegramContext();

  const apiService = useMemo(() => {
    // Aguardar o Telegram context estar ready antes de decidir qual API usar
    if (!ready) {
      return new MockApiService(); // Temporário até decidir qual usar
    }
    
    // Use mock API if explicitly requested OR if not in Telegram environment OR if using mock session token
    const isMockSession = sessionToken === "mock-session-token";
    const shouldUseMock = useMockApi || !isTelegram || isMockSession;
    
    if (shouldUseMock) {
      return new MockApiService();
    }
    
    return new RealApiService(sessionToken);
  }, [useMockApi, isTelegram, sessionToken, ready]);

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
