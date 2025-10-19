import { useContext } from "react";
import { ApiContext } from "../contexts/ApiContext/context";

export const useApi = () => {
  const context = useContext(ApiContext);
  
  if (!context) {
    throw new Error("useApi deve ser usado dentro de um ApiProvider");
  }
  
  return context;
};
