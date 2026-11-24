import { useCallback, useEffect, useState } from "react";

// Light / dark theme for the app. The choice is saved per browser; with no
// saved choice it follows the system setting. index.html applies the saved
// theme before React loads, so pages don't flash light first.
const STORAGE_KEY = "pd-theme";

const readTheme = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage blocked: fall through to the system setting.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Not saved; the theme still changes for this visit.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
