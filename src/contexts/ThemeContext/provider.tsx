import { ThemeContext } from "./context";
import type { ReactNode } from "react";
import { useTelegramContext } from "@/hooks/useTelegramContext";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isTelegram, theme } = useTelegramContext();
  const { getThemeColor, themeFallbacks } = theme;
  
  return (
    <ThemeContext.Provider 
      value={{ 
        isTelegram,
        getThemeColor,
        themeFallbacks
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
