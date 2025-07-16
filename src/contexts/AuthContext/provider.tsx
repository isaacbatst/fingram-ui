import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useTelegramContext } from "../../hooks/useTelegramContext";
import { AuthContext } from "./context";

const SESSION_TOKEN_KEY = "fingram_session_token";

const AuthProvider = ({ children }: PropsWithChildren) => {
  const telegram = useTelegramContext();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    if (!telegram.webApp) {
      console.error("Telegram tg is not defined");
      return;
    }
    telegram.webApp.SecureStorage.removeItem(SESSION_TOKEN_KEY, (err) => {
      if (err) {
        console.error("Failed to remove session token:", err);
        setError("Failed to remove session token");
        return;
      }
      
      setSessionToken(null);
    });
  }, [telegram.webApp]);

  useEffect(() => {
    if (!telegram.ready || !telegram.webApp) {
      console.error("Telegram context is not ready or tg is not defined");
      return;
    }

    setIsLoading(true);
    setError(null);

    telegram.webApp.SecureStorage.getItem(SESSION_TOKEN_KEY, (_err, value) => {
      if (value && value !== "null") {
        setSessionToken(value);
        setIsLoading(false);
        return;
      }

      if (!telegram.webApp) {
        console.error("Telegram tg is not defined");
        setError("Telegram WebApp is not available");
        setIsLoading(false);
        return;
      }

      fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/miniapp/exchange?initData=${encodeURIComponent(
          telegram.webApp.initData
        )}`
      )
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(
              `Failed to exchange init data: ${res.status} ${await res.text()}`
            );
          }
          return res.json();
        })
        .then((data) => {
          if (!telegram.webApp) {
            console.error("Telegram tg is not defined after fetching data");
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
          setError("Usuário não autenticado, gere um novo link de acesso no bot.");
          setIsLoading(false);
        });
    });
  }, [telegram.ready, telegram.webApp]);

  return (
    <AuthContext.Provider value={{ sessionToken, isLoading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
