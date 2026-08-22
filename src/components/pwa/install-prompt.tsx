"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "se-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (hidden || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setHidden(true);
  };
  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-16 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-card p-3 shadow-lg md:left-auto md:right-6 md:w-auto">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--sitaram-yellow)]"><Download className="h-5 w-5 text-[var(--charcoal)]" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install Sitaram EM</p>
        <p className="text-xs text-muted-foreground">Add to home screen for offline use</p>
      </div>
      <Button size="sm" onClick={install}>Install</Button>
      <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={dismiss}><X className="h-4 w-4" /></Button>
    </div>
  );
}