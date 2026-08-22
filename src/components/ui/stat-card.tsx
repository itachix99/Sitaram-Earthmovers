import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  variant = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  variant?: "default" | "charcoal" | "yellow";
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden",
        variant === "charcoal" && "bg-[var(--charcoal)] text-white border-[var(--charcoal)]",
        variant === "yellow" && "bg-[var(--sitaram-yellow)] border-[var(--sitaram-yellow)] text-[var(--charcoal)]"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p
              className={cn(
                "text-xs font-semibold tracking-widest uppercase",
                variant === "charcoal" ? "text-white/60" : variant === "yellow" ? "text-black/60" : "text-muted-foreground"
              )}
            >
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && (
              <p className={cn("text-xs", variant === "charcoal" ? "text-white/60" : "text-muted-foreground")}>{sub}</p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                variant === "charcoal" ? "bg-white/10" : variant === "yellow" ? "bg-black/10" : "bg-muted"
              )}
            >
              <Icon className={cn("h-5 w-5", variant === "charcoal" ? "text-white" : "text-muted-foreground")} />
            </div>
          )}
        </div>
        {trend && (
          <div
            className={cn(
              "mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              trend.positive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
              variant === "charcoal" && "bg-white/15 text-white"
            )}
          >
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
