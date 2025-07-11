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

function getMockInitData(): TelegramWebAppInitData {
  return {
    user: {
      id: 12345678,
      first_name: "Isaac",
      username: "isaacbatst",
      photo_url: "",
    },
    chat: undefined,
    chat_instance: "some-instance-id",
  };
}

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
}

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
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const tgw = (window as unknown as WindowWithTelegram).Telegram?.WebApp;
      if (tgw) {
        tg.current = tgw;
        setIsTelegram(true);
        tg.current.ready();
        setInitData(tg.current.initDataUnsafe || getMockInitData());
        setReady(true);
        setTheme(tg.current.themeParams || {});
        // Adiciona/remover classe .dark conforme o tema do Telegram
        if (tgw.colorScheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };
    document.body.appendChild(script);
    const timeout = setTimeout(() => {
      if (!ready) {
        setInitData(getMockInitData());
        setReady(true);
      }
    }, 3000);
    return () => {
      clearTimeout(timeout);
      document.body.removeChild(script);
    };
    // eslint-disable-next-line
  }, []);

  return {
    tg: tg.current,
    isTelegram,
    ready,
    initData,
    theme: {
      getThemeColor,
      themeFallbacks: THEME_FALLBACKS
    } as TelegramTheme
  };
}
