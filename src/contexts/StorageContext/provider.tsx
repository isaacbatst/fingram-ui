import { useMemo, type PropsWithChildren } from "react";
import { StorageContext } from "./context";
import { TelegramStorageService, LocalStorageService } from "../../services/storage.service";
import { useTelegramContext } from "../../hooks/useTelegramContext";

export const StorageProvider = ({ children }: PropsWithChildren) => {
  const { isTelegram, webApp, ready } = useTelegramContext();

  const storageService = useMemo(() => {
    // Aguardar o contexto Telegram estar ready
    if (!ready) {
      // Retorna LocalStorage temporariamente até decidir
      return new LocalStorageService();
    }
    
    // Se está no Telegram e tem WebApp com SecureStorage disponível
    if (isTelegram && webApp && webApp.SecureStorage) {
      try {
        // Test if SecureStorage is actually working
        return new TelegramStorageService(webApp.SecureStorage);
      } catch (error) {
        console.warn("Telegram SecureStorage not available, falling back to localStorage:", error);
        return new LocalStorageService();
      }
    }
    
    // Fallback para localStorage
    return new LocalStorageService();
  }, [isTelegram, webApp, ready]);

  return (
    <StorageContext.Provider value={{ storageService }}>
      {children}
    </StorageContext.Provider>
  );
};
