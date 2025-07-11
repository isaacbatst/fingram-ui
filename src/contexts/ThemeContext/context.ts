import { createContext } from "react";
import type { TelegramThemeParams, THEME_FALLBACKS } from "@/hooks/useTelegram";

export interface ThemeContextType {
  getThemeColor: (key: keyof TelegramThemeParams) => string;
  isTelegram: boolean;
  themeFallbacks: typeof THEME_FALLBACKS;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
