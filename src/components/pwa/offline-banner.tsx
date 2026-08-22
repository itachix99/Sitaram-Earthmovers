"use client";
import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

  if (online) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-[var(--charcoal)] px-4 py-2 text-xs font-semibold text-white md:text-sm" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }} role="status">
      <WifiOff className="h-4 w-4 text-[var(--sitaram-yellow)]" />
      You are offline — showing cached data. Actions will fail until connection returns.
    </div>
  );
}
