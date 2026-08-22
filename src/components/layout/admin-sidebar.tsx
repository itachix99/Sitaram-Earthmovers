"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPinned,
  Fuel,
  Wrench,
  AlertTriangle,
  Receipt,
  BarChart3,
  FileText,
  Settings,
  Bell,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/machines", label: "Machinery", icon: Truck, badge: "12" },
  { href: "/admin/operators", label: "Operators", icon: Users },
  { href: "/admin/projects", label: "Job Sites", icon: MapPinned },
  { href: "/admin/fuel", label: "Fuel", icon: Fuel },
  { href: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/admin/breakdowns", label: "Breakdowns", icon: AlertTriangle, alert: true },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/revenue", label: "Revenue", icon: Receipt },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const displayName = (session?.user?.name as string) || "Owner";
  const displayEmail = (session?.user?.email as string) || (session?.user as unknown as { role: string; phone: string })?.phone || "owner@sitaram.co.in";
  const role = (session?.user as unknown as { role: string; phone: string })?.role || "OWNER";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card text-card-foreground transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className="flex h-[64px] items-center justify-between border-b px-3">
        <Link href="/admin/dashboard" className={cn(collapsed && "mx-auto")}>
          <Logo collapsed={collapsed} />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted", collapsed && "hidden")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {!collapsed && (
        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Operations</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-[var(--sitaram-yellow)] text-[var(--charcoal)]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", active ? "bg-black/15" : "bg-muted text-muted-foreground")}>{item.badge}</span>
              )}
              {!collapsed && item.alert && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3 space-y-2">
        <div className={cn("flex items-center gap-3 rounded-lg bg-muted p-3", collapsed && "justify-center p-2")}> 
          <div className="h-8 w-8 rounded-full bg-[var(--sitaram-yellow)] flex items-center justify-center text-xs font-bold text-[var(--charcoal)] shrink-0">
            {displayName.slice(0,2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayEmail} • {role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="p-1 hover:bg-muted rounded" title="Sign out">
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        {!collapsed && (
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-xs text-muted-foreground hover:text-foreground text-left px-2 py-1">Sign out</button>
        )}
        {collapsed && (
          <Button variant="ghost" size="icon" className="mt-2 w-full text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setCollapsed(false)}>
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        )}
      </div>
    </aside>
  );
}
