import { useMemo, useCallback, useEffect, useState, type PropsWithChildren } from "react";
import { ApiContext } from "./context";
import { StandaloneApiService } from "../../services/standalone-api.service";
import { mutate } from "swr";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

export const ApiProvider = ({ children }: PropsWithChildren) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTempToken, setPendingTempToken] = useState<string | null>(null);

  // Always provide an API service
  const apiService = useMemo(() => {
    console.log("API: Usando Standalone API com cookie authentication");
    return new StandaloneApiService();
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear server-side session
      await fetch(`${API_BASE_URL}/vault/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn("Failed to logout on server:", err);
    } finally {
      // Clear local authentication state
      setIsAuthenticated(false);
    }
  }, []);

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
      
      // Authentication successful - cookie is set by server
      setIsAuthenticated(true);
      setIsLoading(false);
      
      return data;
    } catch (error) {
      console.error("Error during vault authentication:", error);
      setError("Token de acesso inválido. Verifique o token e tente novamente.");
      setIsLoading(false);
      throw error;
    }
  }, []);

  const authenticateWithTempToken = useCallback(async (tempToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/vault/authenticate-temp-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tempToken }),
        credentials: 'include', // Include cookies for HTTP-only authentication
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.vaultId) {
        throw new Error("No vault ID received from the server");
      }

      // Authentication successful - cookie is set by server
      setIsAuthenticated(true);
      setIsLoading(false);
      setPendingTempToken(null); // Clear pending token after successful authentication
      
      return data;
    } catch (error) {
      console.error("Error during temp token authentication:", error);
      setError("Token temporário inválido ou expirado. Gere um novo link no bot.");
      setIsLoading(false);
      setPendingTempToken(null); // Clear pending token on error
      throw error;
    }
  }, []);

  const confirmTempTokenExchange = useCallback(async () => {
    if (!pendingTempToken) return;
    await authenticateWithTempToken(pendingTempToken);
  }, [pendingTempToken, authenticateWithTempToken]);

  const dismissTempToken = useCallback(() => {
    setPendingTempToken(null);
    setError(null);
    // Remove token from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('token');
    window.history.replaceState({}, '', newUrl.toString());
  }, []);

  useEffect(() => {
    // Check for temporary token in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const tempToken = urlParams.get('token');
    
    if (tempToken) {
      // Set pending token instead of auto-authenticating
      setPendingTempToken(tempToken);
      setIsLoading(false);
      return;
    }

    // Check authentication status via API
    const checkAuthenticationStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vault/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          // User is authenticated
          setIsAuthenticated(true);
        } else {
          // User is not authenticated
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.warn("Error checking authentication status:", error);
        // Assume not authenticated on error
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthenticationStatus();
  }, [authenticateWithTempToken]);

  // Refetch data when authentication status changes
  useMemo(() => {
    if (isAuthenticated) {
      mutate("summary"); // Refetch summary data on authentication change
      mutate("categories"); // Refetch categories data on authentication change
      mutate((key) => typeof key === 'string' ? key.startsWith("transactions") : false); // Refetch transactions data on authentication change
    }
  }, [isAuthenticated]);

  return (
    <ApiContext.Provider value={{ 
      apiService,
      isAuthenticated,
      isLoading, 
      error, 
      logout,
      authenticateWithVaultToken,
      authenticateWithTempToken,
      pendingTempToken,
      confirmTempTokenExchange,
      dismissTempToken
    }}>
      {children}
    </ApiContext.Provider>
  );
};
