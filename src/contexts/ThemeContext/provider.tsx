import { ThemeContext } from "./context";
import type { ReactNode } from "react";

const THEME_FALLBACKS = {
  bg_color: "#ffffff",
  text_color: "#000000",
  hint_color: "#999999",
  link_color: "#2481cc",
  button_color: "#2481cc",
  button_text_color: "#ffffff",
  secondary_bg_color: "#f1f1f1",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const getThemeColor = (key: string) => {
    return THEME_FALLBACKS[key as keyof typeof THEME_FALLBACKS] || "#000000";
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        isTelegram: false,
        getThemeColor,
        themeFallbacks: THEME_FALLBACKS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
