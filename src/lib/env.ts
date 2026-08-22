import { z } from "zod";

/**
 * Fail-fast environment validation.
 * Imported by src/lib/prisma.ts and src/auth.ts so a misconfigured deploy
 * crashes at boot with an actionable message instead of failing at request time.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (e.g. file:./dev.db for SQLite or a postgres:// URL)"),
  AUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}\nCopy .env.example to .env and fill the values before starting the app.`);
}

export const env = {
  DATABASE_URL: parsed.data.DATABASE_URL,
  AUTH_SECRET: parsed.data.AUTH_SECRET ?? parsed.data.NEXTAUTH_SECRET,
};

if (!env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) must be set in production — sessions cannot be signed securely without it.");
}
