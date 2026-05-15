import { useState, useEffect } from "react";

interface SetSearchParamsOptions {
  replace?: boolean;
}

const SEARCH_PARAMS_CHANGED = "duna:searchparamschange";

export const useSearchParams = () => {
  const [searchParams, setSearchParamsState] = useState(
    new URLSearchParams(window.location.search)
  );

  const setSearchParams = (params: Record<string, string>, options?: SetSearchParamsOptions) => {
    const newParams = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(params)) {
      if (value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    }
    const url = `?${newParams.toString()}`;
    if (options?.replace) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
    setSearchParamsState(newParams);
    window.dispatchEvent(new Event(SEARCH_PARAMS_CHANGED));
  };

  useEffect(() => {
    const listener = () => setSearchParamsState(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", listener);
    window.addEventListener(SEARCH_PARAMS_CHANGED, listener);
    return () => {
      window.removeEventListener("popstate", listener);
      window.removeEventListener(SEARCH_PARAMS_CHANGED, listener);
    };
  }, []);

  return [searchParams, setSearchParams] as const;
};
