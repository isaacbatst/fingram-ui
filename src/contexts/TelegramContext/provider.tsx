import type { ReactNode } from "react";
import { TelegramContext } from "./context";
import { useTelegram } from "@/hooks/useTelegram";

export function TelegramProvider({ children }: { children: ReactNode }) {
  const telegram = useTelegram();
  
  return (
    <TelegramContext.Provider value={telegram}>
      {children}
    </TelegramContext.Provider>
  );
}
