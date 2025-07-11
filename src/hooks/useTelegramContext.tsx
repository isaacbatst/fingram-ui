import { useContext } from "react";
import { TelegramContext } from "../contexts/TelegramContext/context";
import type { TelegramContextType } from "../contexts/TelegramContext/context";

export function useTelegramContext(): TelegramContextType {
  const context = useContext(TelegramContext);
  
  if (context === undefined) {
    throw new Error("useTelegramContext deve ser usado dentro de um TelegramProvider");
  }
  
  return context;
}
