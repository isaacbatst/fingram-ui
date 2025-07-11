import type { TelegramTheme } from "@/hooks/useTelegram";

export interface ThemeContextType extends TelegramTheme {
  isTelegram: boolean;
  ready: boolean;
}
