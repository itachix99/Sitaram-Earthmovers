/**
 * Append-only audit trail helper.
 * Call writeAudit() inside server actions after any sensitive mutation.
 * Failures are logged but never block the primary operation.
 */
import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: (input.metadata as never) ?? undefined,
      },
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}