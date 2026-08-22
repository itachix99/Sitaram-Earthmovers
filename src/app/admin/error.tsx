"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Admin error:", error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
      <h2 className="text-xl font-bold">Admin view failed</h2>
      <p className="max-w-sm text-sm text-muted-foreground">Could not load this admin section. Your data is safe — try again. If it persists, check health and audit logs.</p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>}
      <div className="flex gap-2"><Button onClick={reset}>Try again</Button><Button variant="outline" asChild><a href="/admin/dashboard">Go to dashboard</a></Button></div>
    </div>
  );
}
