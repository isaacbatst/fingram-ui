export interface ThemeContextType {
  isTelegram: boolean;
  getThemeColor: (key: string) => string;
  themeFallbacks: Record<string, string>;
}
