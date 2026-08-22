import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Protected readiness: if HEALTH_TOKEN is set, require Authorization: Bearer <token>
function isAuthorized(req: Request): boolean {
  const token = process.env.HEALTH_TOKEN;
  if (!token) return true; // open in dev if no token set
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${token}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    logger.warn("health unauthorized", { ip: req.headers.get("x-forwarded-for") || "local" });
    return Response.json({ status: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - started;
    logger.info("health ok", { latencyMs });
    return Response.json({ status: "ok", db: "up", latencyMs, time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logger.error("health degraded", { error: e instanceof Error ? e.message : String(e) });
    return Response.json({ status: "degraded", db: "down", error: e instanceof Error ? e.message : String(e) }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
