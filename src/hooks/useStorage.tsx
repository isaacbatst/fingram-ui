import { useContext } from "react";
import { StorageContext } from "../contexts/StorageContext/context";

export function useStorage() {
  const context = useContext(StorageContext);
  
  if (context === undefined) {
    throw new Error("useStorage deve ser usado dentro de um StorageProvider");
  }
  
  return context.storageService;
}
