/**
 * Minimal in-memory sliding-window rate limiter for login attempts.
 *
 * Scope: single-instance deployments. For multi-instance scale, back this
 * interface with Redis (INCR + EXPIRE) - the call sites only need these three
 * functions and stay unchanged.
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const PRUNE_THRESHOLD = 1000;

interface AttemptRecord {
  count: number;
  firstAt: number;
}

const attempts = new Map<string, AttemptRecord>();

function pruneExpired(now: number): void {
  attempts.forEach((rec: AttemptRecord, key: string) => {
    if (now - rec.firstAt > WINDOW_MS) attempts.delete(key);
  });
}

export function loginRateLimitKey(identifier: string, ip: string): string {
  return identifier.trim().toLowerCase() + "|" + ip;
}

export function isLoginRateLimited(key: string): boolean {
  const rec = attempts.get(key) as AttemptRecord | undefined;
  if (!rec) return false;
  if (Date.now() - rec.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

export function registerLoginFailure(key: string): void {
  const now = Date.now();
  if (attempts.size > PRUNE_THRESHOLD) pruneExpired(now);
  const rec = attempts.get(key) as AttemptRecord | undefined;
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
  } else {
    rec.count += 1;
  }
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
