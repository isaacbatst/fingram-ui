import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext/context";
import type { ThemeContextType } from "@/contexts/ThemeContext/context";

// Hook para usar o tema
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  
  return context;
}
