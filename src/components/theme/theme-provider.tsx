/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "sitaram-theme";

type Ctx = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeCtx = React.createContext<Ctx | null>(null);

function getStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (v === "light" || v === "dark" || v === "system") return v;
    return null;
  } catch { return null; }
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolved, setResolved] = React.useState<ResolvedTheme>("light");
  const [mounted, setMounted] = React.useState(false);

  // initial — sync persisted preference before paint
  React.useEffect(() => {
    const stored = getStored();
    const initial: Theme = stored ?? "system";
    setThemeState(initial);
    const r: ResolvedTheme = initial === "system" ? systemTheme() : initial;
    setResolved(r);
    apply(r);
    setMounted(true);
  }, []);

  // system listener when on system
  React.useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = mql.matches ? "dark" as const : "light" as const;
      setResolved(r);
      apply(r);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  // cross-tab sync
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const v = (e.newValue as Theme | null) ?? "system";
      const next: Theme = v === "light" || v === "dark" || v === "system" ? v : "system";
      setThemeState(next);
      const r: ResolvedTheme = next === "system" ? systemTheme() : next;
      setResolved(r);
      apply(r);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
    const r: ResolvedTheme = t === "system" ? systemTheme() : t;
    setResolved(r);
    apply(r);
  }, []);

  const toggle = React.useCallback(() => {
    // binary toggle light <-> dark (system resolves then flips)
    setThemeState((prev) => {
      const curResolved: ResolvedTheme = prev === "system" ? systemTheme() : prev;
      const next: ResolvedTheme = curResolved === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      setResolved(next);
      apply(next);
      return next;
    });
  }, []);

  // avoid flash mismatch — provider is lightweight, no blocking needed beyond inline script in layout
  // expose mounted so toggle can show correct icon immediately
  void mounted;

  return (
    <ThemeCtx.Provider value={{ theme, resolvedTheme: resolved, setTheme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}