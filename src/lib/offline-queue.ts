/**
 * Offline write queue — idempotent, encrypted, conflict-aware.
 *
 * Status: STUB / design doc for future implementation.
 * Current PWA is network-first for operator pages; writes (startWork/fuel/breakdown)
 * require network. This queue is the next step if offline writes are desired.
 *
 * Design (to implement when offline writes are prioritized):
 * - Store: IndexedDB (idb) keyed by idempotencyKey = `${action}:${userId}:${clientTimestamp}:${nonce}`
 * - Encrypt payload with Web Crypto (AES-GCM) using a per-user key derived from AUTH_SECRET via HKDF
 * - On reconnect: POST /api/sync with queue items; server de-duplicates by idempotencyKey (unique index)
 * - Conflict handling: last-write-wins per (machineId, userId) for fuel/breakdown; work sessions use
 *   partial unique indexes — server returns 409 with current state, client shows “someone else started work”
 * - UI: queue length badge + “pending sync” + manual “retry/clear”
 * - Purge: clearOperatorCaches() also clears se-offline-queue on logout/user change
 *
 * Do NOT enable offline writes until this queue ships — otherwise stale assignment checks could be bypassed.
 */
export type QueuedAction = {
  idempotencyKey: string;
  action: "startWork" | "endWork" | "createFuelLog" | "createBreakdown";
  payload: Record<string, unknown>;
  createdAt: string;
  userId: string;
};

export async function enqueue(_action: QueuedAction): Promise<void> {
  throw new Error("Offline queue not yet implemented — see docs/offline-queue.md");
}

export async function syncQueue(): Promise<{ synced: number; conflicts: unknown[] }> {
  return { synced: 0, conflicts: [] };
}
