import { createContext } from "react";
import type { StorageService } from "../../services/storage.service";

export interface StorageContextType {
  storageService: StorageService;
}

export const StorageContext = createContext<StorageContextType | undefined>(undefined);
