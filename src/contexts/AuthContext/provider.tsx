import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useTelegramContext } from "../../hooks/useTelegramContext";
import { AuthContext } from "./context";

const SESSION_TOKEN_KEY = "fingram_session_token";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

const AuthProvider = ({ children }: PropsWithChildren) => {
  const telegram = useTelegramContext();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    if (!telegram.isTelegram || !telegram.webApp) {
      // Se não estiver no Telegram, apenas limpe o estado local
      setSessionToken(null);
      return;
    }

    try {
      telegram.webApp.SecureStorage.removeItem(SESSION_TOKEN_KEY, (err) => {
        if (err) {
          console.error("Failed to remove session token:", err);
          setError("Failed to remove session token");
          return;
        }
        setSessionToken(null);
      });
    } catch (err) {
      console.error("SecureStorage not available:", err);
      setSessionToken(null);
    }
  }, [telegram.isTelegram, telegram.webApp]);

  useEffect(() => {
    console.log("AuthProvider useEffect", { 
      isTelegram: telegram.isTelegram, 
      ready: telegram.ready,
      webApp: !!telegram.webApp 
    });
    
    // Se não estiver no Telegram, simule autenticação para permitir uso da API mock
    if (!telegram.isTelegram) {
      console.log("Not in Telegram environment, using mock authentication");
      setSessionToken("mock-session-token");
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!telegram.ready || !telegram.webApp) {
      console.log("Telegram context not ready yet...");
      return;
    }

    console.log("In Telegram environment, proceeding with real authentication");
    setIsLoading(true);
    setError(null);

    try {
      telegram.webApp.SecureStorage.getItem(SESSION_TOKEN_KEY, (_err, value) => {
        if (value && value !== "null") {
          setSessionToken(value);
          setIsLoading(false);
          return;
        }

        if (!telegram.webApp) {
          console.error("Telegram WebApp is not available");
          setError("Telegram WebApp is not available");
          setIsLoading(false);
          return;
        }

        const exchangeUrl = `${API_BASE_URL}/miniapp/exchange?initData=${encodeURIComponent(
          telegram.webApp.initData
        )}`;

        fetch(exchangeUrl)
          .then(async (res) => {
            if (!res.ok) {
              throw new Error(
                `Failed to exchange init data on ${exchangeUrl}: ${res.status} ${await res.text()}`
              );
            }
            return res.json();
          })
          .then((data) => {
            if (!telegram.webApp) {
              console.error("Telegram WebApp is not available after fetching data");
              setError("Telegram WebApp is not available after fetching data");
              setIsLoading(false);
              return;
            }
            if (!data || !data.token) {
              console.error("No token received from the server.");
              setError("No token received from the server");
              setIsLoading(false);
              return;
            }
            setSessionToken(data.token);
            telegram.webApp.SecureStorage.setItem(
              SESSION_TOKEN_KEY,
              data.token,
              (err) => {
                if (err) {
                  console.error("Failed to save session token:", err);
                  setError("Failed to save session token");
                }
                setIsLoading(false);
              }
            );
          })
          .catch((error) => {
            console.error("Error during session token exchange:", error);
            setError("Usuário não autenticado, gere um novo link de acesso no bot." + error.message);
            setIsLoading(false);
          });
      });
    } catch (err) {
      console.error("SecureStorage not available:", err);
      setError("SecureStorage not available. Please access this app through Telegram.");
      setIsLoading(false);
    }
  }, [telegram.ready, telegram.webApp, telegram.isTelegram]);

  return (
    <AuthContext.Provider value={{ sessionToken, isLoading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
