import { createContext } from "react";
import type { TelegramTheme, TelegramWebApp, TelegramWebAppInitData } from "@/hooks/useTelegram";

export interface TelegramContextType {
  tg: TelegramWebApp | null;
  isTelegram: boolean;
  ready: boolean;
  initData: TelegramWebAppInitData | null;
  theme: TelegramTheme;
}

export const TelegramContext = createContext<TelegramContextType | undefined>(undefined);
