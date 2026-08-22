"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, size = "default" }: { className?: string; size?: "default" | "sm" | "icon" }) {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:scale-[0.96]",
        size === "sm" ? "h-8 w-8" : size === "icon" ? "h-9 w-9" : "h-9 w-9",
        isDark
          ? "bg-white/[0.08] border-white/10 text-white hover:bg-white/12 hover:border-white/15"
          : "bg-white border-border text-foreground hover:bg-muted",
        "dark:bg-white/[0.08] dark:border-white/10 dark:text-white dark:hover:bg-white/12",
        className
      )}
    >
      {/* Sun */}
      <Sun
        className={cn(
          "h-[18px] w-[18px] absolute transition-all duration-300",
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        )}
      />
      {/* Moon */}
      <Moon
        className={cn(
          "h-[18px] w-[18px] absolute transition-all duration-300",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
        )}
      />
    </button>
  );
}

// Compact inline toggle for mobile sheets / headers where a labelled button is nicer
export function ThemeToggleWithLabel({ className }: { className?: string }) {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        isDark
          ? "bg-white/10 border-white/10 text-white hover:bg-white/15"
          : "bg-card border-border text-foreground hover:bg-muted",
        className
      )}
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
