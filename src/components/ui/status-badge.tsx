import { cn } from "@/lib/utils";


const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  WORKING: { label: "Working", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25", dot: "bg-emerald-500" },
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25", dot: "bg-emerald-500" },
  IDLE: { label: "Idle", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25", dot: "bg-amber-500" },
  UNDER_MAINTENANCE: { label: "Maintenance", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25", dot: "bg-blue-500" },
  BROKEN_DOWN: { label: "Breakdown", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25", dot: "bg-red-500" },
  RETIRED: { label: "Retired", className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:border-zinc-500/25", dot: "bg-zinc-400" },
  COMPLETED: { label: "Completed", className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:border-zinc-500/25", dot: "bg-zinc-400" },
  ON_HOLD: { label: "On Hold", className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25", dot: "bg-orange-500" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = statusConfig[status] ?? { label: status, className: "bg-muted text-muted-foreground border", dot: "bg-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", cfg.className, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
