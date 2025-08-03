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
    // Use mock API if explicitly requested OR if not in Telegram environment OR if using mock session token
    const isMockSession = sessionToken === "mock-session-token";
    const shouldUseMock = useMockApi || !isTelegram || isMockSession;
    
    console.log("ApiProvider - Environment check [DETAILED]:", {
      useMockApi,
      isTelegram,
      ready,
      sessionToken: sessionToken ? (isMockSession ? "mock-session-token" : "real-token") : "null",
      isMockSession,
      shouldUseMock,
      timestamp: new Date().toISOString(),
      condition: `useMockApi=${useMockApi} || !isTelegram=${!isTelegram} || isMockSession=${isMockSession} = ${shouldUseMock}`
    });
    
    if (shouldUseMock) {
      console.log("✅ Using Mock API Service (not in Telegram, mock session, or explicitly requested)");
      return new MockApiService();
    }
    
    console.log("⚠️ Using Real API Service (in Telegram environment with real session)");
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
