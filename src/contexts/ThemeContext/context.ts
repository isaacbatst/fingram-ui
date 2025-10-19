import { createContext } from "react";

export interface ThemeContextType {
  getThemeColor: (key: string) => string;
  isTelegram: boolean;
  themeFallbacks: Record<string, string>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
