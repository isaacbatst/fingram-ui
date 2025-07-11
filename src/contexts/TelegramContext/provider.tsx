import type { ReactNode } from "react";
import { TelegramContext } from "./context";
import { useTelegram } from "@/hooks/useTelegram";

export function TelegramProvider({ children }: { children: ReactNode }) {
  const telegramData = useTelegram();
  
  return (
    <TelegramContext.Provider value={telegramData}>
      {children}
    </TelegramContext.Provider>
  );
}
