import { useEffect, useRef, useState } from "react";

// ThemeParams vem em Telegram.WebApp.themeParams
export type TelegramThemeParams = {
  bg_color?: string; // #RRGGBB
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  bottom_bar_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
};

export type TelegramWebAppUser = {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type TelegramWebAppInitData = {
  user?: TelegramWebAppUser;
  chat?: { id: number; type: string; title: string; username?: string };
  chat_instance?: string;
  start_param?: string;
  auth_date?: number;
  hash?: string;
  [key: string]: unknown;
};

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  ready: () => void;
  close: () => void;
  sendData: (data: string) => void;
  expand: () => void;
  SecureStorage: {
    setItem: (
      key: string,
      value: string,
      callback?: (error: Error | null, success?: boolean) => void
    ) => TelegramWebApp["SecureStorage"];
    getItem: (
      key: string,
      callback: (
        error: Error | null,
        value?: string,
        canRestore?: boolean
      ) => void
    ) => TelegramWebApp["SecureStorage"];
    restoreItem: (
      key: string,
      callback?: (error: Error | null, value?: string) => void
    ) => TelegramWebApp["SecureStorage"];
    removeItem: (
      key: string,
      callback?: (error: Error | null, success?: boolean) => void
    ) => TelegramWebApp["SecureStorage"];
    clear: (
      callback?: (error: Error | null, success?: boolean) => void
    ) => TelegramWebApp["SecureStorage"];
  };
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    isVisible: boolean;
    isActive: boolean;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    // ... outros métodos
  };
  // ... outros métodos/campos do Telegram.WebApp
};

type WindowWithTelegram = Window & {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
};


// Fallbacks padrão para cada cor do tema do Telegram
export const THEME_FALLBACKS: Record<keyof TelegramThemeParams, string> = {
  bg_color: "#f5f7fa",
  text_color: "#22223b",
  hint_color: "#6366f1",
  link_color: "#16a34a",
  button_color: "#6366f1",
  button_text_color: "#fff",
  secondary_bg_color: "#fff",
  header_bg_color: "#f5f7fa",
  bottom_bar_bg_color: "#f5f7fa",
  accent_text_color: "#4f46e5",
  section_bg_color: "#fff",
  section_header_text_color: "#6366f1",
  section_separator_color: "#e0e7ff",
  subtitle_text_color: "#6b7280",
  destructive_text_color: "#ef4444",
};

export type TelegramTheme = {
  getThemeColor: (key: keyof TelegramThemeParams) => string;
  themeFallbacks: typeof THEME_FALLBACKS;
};

export function useTelegram() {
  const tg = useRef<TelegramWebApp>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [ready, setReady] = useState(false);
  const [initData, setInitData] = useState<TelegramWebAppInitData | null>(null);
  const [theme, setTheme] = useState<TelegramThemeParams>({});

  // Utilitário para pegar cor do tema ou fallback padrão
  function getThemeColor(key: keyof TelegramThemeParams) {
    const val = theme[key];
    if (val && /^#[0-9A-Fa-f]{6}$/.test(val)) return val;
    return THEME_FALLBACKS[key];
  }

  useEffect(() => {
    if (ready) return;
    
    // Verificar se já existe Telegram WebApp disponível
    const existingTelegram = (window as unknown as WindowWithTelegram).Telegram?.WebApp;
    if (existingTelegram) {
      // Check if we're actually in a Telegram environment
      const initData = existingTelegram.initDataUnsafe;
      const hasValidUser = initData?.user?.id && initData?.user?.first_name;
      
      if (hasValidUser) {
        // We're actually in Telegram
        tg.current = existingTelegram;
        setIsTelegram(true);
        tg.current.ready();
        setInitData(initData);
        setReady(true);
        setTheme(tg.current.themeParams || {});
        
        // Adiciona/remover classe .dark conforme o tema do Telegram
        if (existingTelegram.colorScheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        return;
        } else {
          // WebApp object exists but we're not actually in Telegram
          console.log("Telegram WebApp object exists but no valid user data - not in Telegram environment");
          setIsTelegram(false);
          setReady(true);
          setInitData(null);
          return;
        }
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js?58";
    script.async = true;
    script.onload = () => {
      const tgw = (window as unknown as WindowWithTelegram).Telegram?.WebApp;
      if (tgw) {
        // Check if we're actually in a Telegram environment
        // by verifying if we have valid initData with user information
        const initData = tgw.initDataUnsafe;
        const hasValidUser = initData?.user?.id && initData?.user?.first_name;
        
        if (hasValidUser) {
          // We're actually in Telegram
          tg.current = tgw;
          setIsTelegram(true);
          tg.current.ready();
          setInitData(initData);
          setReady(true);
          setTheme(tg.current.themeParams || {});
          // Adiciona/remover classe .dark conforme o tema do Telegram
          if (tgw.colorScheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          // WebApp object exists but we're not actually in Telegram
          console.log("Telegram WebApp object exists but no valid user data - not in Telegram environment");
          setIsTelegram(false);
          setReady(true);
          setInitData(null);
        }
      } else {
        // Se não conseguiu carregar o Telegram WebApp, continue como não-Telegram
        console.log("Telegram WebApp not available, continuing without it");
        setIsTelegram(false);
        setReady(true);
        setInitData(null);
      }
    };
    
    script.onerror = () => {
      // Se falhou ao carregar o script, continue como não-Telegram
      console.log("Failed to load Telegram WebApp script, continuing without it");
      setIsTelegram(false);
      setReady(true);
      setInitData(null);
    };
    
    document.body.appendChild(script);
    
    return () => {
      try {
        document.body.removeChild(script);
      } catch {
        // Script pode já ter sido removido
      }
    };
  }, [ready]);

  return {
    webApp: tg.current,
    isTelegram,
    ready,
    initData,
    theme: {
      getThemeColor,
      themeFallbacks: THEME_FALLBACKS,
    } as TelegramTheme,
  };
}
