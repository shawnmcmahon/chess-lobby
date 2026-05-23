import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "./themes";
import { ThemeContext, type ThemeContextValue } from "./themeContext";

const STORAGE_KEY = "chess-lobby:theme";

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => readStoredTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
