"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Fuel, AlertTriangle, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/operator/today", label: "Today", icon: Home },
  { href: "/operator/fuel", label: "Fuel", icon: Fuel },
  { href: "/operator/report-issue", label: "Report", icon: AlertTriangle },
  { href: "/operator/history", label: "History", icon: Clock },
  { href: "/operator/profile", label: "Profile", icon: User },
];

export function OperatorNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
      <div className="flex justify-around">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[60px] flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors",
                active ? "text-[var(--charcoal)] bg-[var(--sitaram-yellow)]" : "text-muted-foreground"
              )}
            >
              <it.icon className="h-5 w-5" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
