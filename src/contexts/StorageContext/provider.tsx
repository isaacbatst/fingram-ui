import { useMemo, type PropsWithChildren } from "react";
import { StorageContext } from "./context";
import { LocalStorageService } from "../../services/storage.service";

export const StorageProvider = ({ children }: PropsWithChildren) => {
  const storageService = useMemo(() => {
    return new LocalStorageService();
  }, []);

  return (
    <StorageContext.Provider value={{ storageService }}>
      {children}
    </StorageContext.Provider>
  );
};
