import { useState, useEffect } from "react";

export const useSearchParams = () => {
  const [searchParams, setSearchParamsState] = useState(
    new URLSearchParams(window.location.search)
  );

  const setSearchParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(params)) {
      newParams.set(key, value);
    }
    window.history.pushState({}, '', `?${newParams.toString()}`);
    setSearchParamsState(newParams);
  };

  useEffect(() => {
    const listener = () => setSearchParamsState(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  return [searchParams, setSearchParams] as const;
};
