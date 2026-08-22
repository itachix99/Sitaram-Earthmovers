"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
      <Logo />
      <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Your data is safe — try again. If the problem persists, contact support.
      </p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>}
      <div className="flex gap-2">
        <Button onClick={reset} size="lg">Try again</Button>
        <Button variant="outline" size="lg" asChild><a href="/operator/today">Go home</a></Button>
      </div>
    </main>
  );
}
