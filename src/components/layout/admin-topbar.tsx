"use client";
import { Bell, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";

export function AdminTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-[64px] w-full max-w-full min-w-0 items-center gap-2 sm:gap-4 overflow-x-clip border-b bg-card px-3 sm:px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search machines, operators, sites..." className="pl-9 bg-muted/50" />
        </div>
      </div>

      <div className="flex flex-1 min-w-0 items-center justify-between md:justify-end gap-2 sm:gap-3">
        <div className="md:hidden min-w-0 shrink-0">
          <Logo />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            System operational
          </span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/admin/notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </Link>
          </Button>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <Link href="/operator/today" className="hidden sm:inline-flex text-xs font-semibold text-muted-foreground hover:text-foreground">
            Switch to Operator →
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 top-[64px] w-full border-b bg-card p-4 shadow-lg md:hidden">
          <nav className="grid gap-1">
            {["Dashboard", "Machinery", "Operators", "Job Sites", "Fuel", "Maintenance", "Breakdowns", "Notifications"].map((l) => (
              <Link key={l} href={`/admin/${l.toLowerCase().replace(" ","-")}`} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
                {l}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
