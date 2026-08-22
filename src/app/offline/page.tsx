import { Logo } from "@/components/brand/logo";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"><WifiOff className="h-8 w-8 text-muted-foreground" /></div>
      <Logo />
      <h1 className="text-xl font-bold tracking-tight">You are offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page is not cached yet. Previously opened operator pages may still load from cache.
        Reconnect and try again to sync the latest data.
      </p>
      <a href="/operator/today" className="mt-2 inline-flex h-11 items-center rounded-lg bg-[var(--charcoal)] px-6 text-sm font-semibold text-white hover:opacity-90">
        Retry Today&apos;s Page
      </a>
    </main>
  );
}
