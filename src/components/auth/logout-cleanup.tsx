"use client";
import { useEffect } from "react";

/**
 * Clears Service Worker caches on logout / user change to prevent a previous
 * operator\u0027s data leaking on shared/offline devices. Mount once in the root
 * layout or call clearOperatorCaches() from your logout handler.
 * Also notifies the SW via postMessage for se-runtime-* partition purge.
 */
export async function clearOperatorCaches() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.includes("se-runtime")).map(k => caches.delete(k)));
    }
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_OPERATOR_CACHE" });
    } else if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: "CLEAR_OPERATOR_CACHE" });
    }
    // Also clear any offline queue for the previous user
    try { localStorage.removeItem("se-offline-queue"); } catch {}
  } catch {}
}

export function notifyUserChanged(userId: string) {
  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SET_USER", userId });
    }
  } catch {}
}

export function LogoutCacheCleaner({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (trigger) void clearOperatorCaches();
  }, [trigger]);
  return null;
}
