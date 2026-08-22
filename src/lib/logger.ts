// Structured logger — pino-style JSON, console in dev, ready for Sentry/Datadog
type Level = "info" | "warn" | "error";
function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  const entry = { level, msg, time: new Date().toISOString(), ...meta };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  // Hook: if SENTRY_DSN set, forward errors
  if (level === "error" && process.env.SENTRY_DSN) {
    // import("@sentry/nextjs").then(({ captureException }) => captureException(new Error(msg)))
  }
}
export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
