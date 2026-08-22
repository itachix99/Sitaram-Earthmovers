"use client";

import { Button } from "@/components/ui/button";

const FORMATS = [
  { fmt: "csv", label: "Export CSV", variant: "outline" },
  { fmt: "xlsx", label: "Export Excel", variant: "outline" },
  { fmt: "pdf", label: "Export PDF", variant: "default" },
] as const;

/** Filesystem-safe "YYYY-MM-DD_HH-MM" stamp, computed fresh at click time. */
function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

export function ExportButtons({ type, query }: { type: string; query: string }) {
  // Keep the name filesystem-safe even if an unexpected ?type= shows up.
  const safeType = type.replace(/[^a-zA-Z0-9_-]+/g, "") || "report";
  return (
    <div className="flex gap-2">
      {FORMATS.map((f) => (
        <Button key={f.fmt} variant={f.variant} asChild>
          <a
            href={`/api/reports/export?${query}&format=${f.fmt}`}
            download
            onClick={(e) => {
              // Explicit per-click filename, e.g. sitaram-fuel-report_2025-06-12_14-35.csv
              e.currentTarget.download = `sitaram-${safeType}-report_${stamp()}.${f.fmt}`;
            }}
          >
            {f.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
