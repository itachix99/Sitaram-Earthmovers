"use server";
import { prisma } from "@/lib/prisma";
import { getActionUser, getActionAdmin } from "@/lib/auth-guards";
import { breakdownSchema, breakdownUpdateSchema } from "@/lib/validations/breakdown";
import { revalidatePath } from "next/cache";

export async function createBreakdown(prevState: unknown, formData: FormData) {
  const user = await getActionUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;
  const raw = {
    machineId: formData.get("machineId") as string,
    severity: (formData.get("severity") as string) || "MEDIUM",
    issue: formData.get("issue") as string,
    description: (formData.get("description") as string) || "",
    location: (formData.get("location") as string) || "",
    photoUrl: (formData.get("photoUrl") as string) || "",
  };
  const parsed = breakdownSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  const machine = await prisma.machine.findUnique({ where: { id: d.machineId } });
  if (!machine) return { error: "Machine not found" };

  // Operators may only report issues for machines they are actively assigned to.
  if (user.role === "OPERATOR") {
    const assigned = await prisma.assignment.findFirst({
      where: { operatorId: userId, machineId: d.machineId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!assigned) return { error: "You can only report issues for your assigned machine." };
  }

  await prisma.breakdownReport.create({
    data: {
      machineId: d.machineId,
      operatorId: userId,
      severity: d.severity as never,
      issue: d.issue,
      description: d.description || null,
      location: d.location || null,
      photoUrl: d.photoUrl || null,
      status: "OPEN",
    }
  });
  // Flag the machine BROKEN_DOWN on severe reports — but never overwrite
  // maintenance/retired states.
  const flagWorthy = machine.status === "ACTIVE" || machine.status === "WORKING" || machine.status === "IDLE";
  if ((d.severity === "CRITICAL" || d.severity === "HIGH") && flagWorthy) {
    await prisma.machine.update({ where: { id: d.machineId }, data: { status: "BROKEN_DOWN" } });
  }
  revalidatePath("/admin/breakdowns");
  revalidatePath("/operator/report-issue");
  return { success: true };
}

export async function updateBreakdown(id: string, prevState: unknown, formData: FormData) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized — OWNER/ADMIN only" };
  const raw = {
    status: formData.get("status") as string,
    resolutionNotes: (formData.get("resolutionNotes") as string) || "",
    severity: (formData.get("severity") as string) || undefined,
  };
  if (!raw.severity) delete (raw as Record<string,unknown>).severity;
  const parsed = breakdownUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  const report = await prisma.breakdownReport.findUnique({ where: { id } });
  if (!report) return { error: "Report not found" };
  const data: Record<string, unknown> = { status: d.status };
  if (d.resolutionNotes) data.resolutionNotes = d.resolutionNotes;
  if (d.severity) data.severity = d.severity;
  if (d.status === "RESOLVED") data.resolvedAt = new Date();
  await prisma.breakdownReport.update({ where: { id }, data: data as never });
  if (d.status === "RESOLVED") {
    // Safety-aware transition: only return the machine to IDLE when this was
    // the last unresolved incident and no work session is running.
    const [openIncidents, activeSession, current] = await Promise.all([
      prisma.breakdownReport.count({ where: { machineId: report.machineId, id: { not: id }, status: { not: "RESOLVED" } } }),
      prisma.workSession.findFirst({ where: { machineId: report.machineId, status: "ACTIVE" }, select: { id: true } }),
      prisma.machine.findUnique({ where: { id: report.machineId }, select: { status: true } }),
    ]);
    const canIdle = openIncidents === 0 && !activeSession && current?.status === "BROKEN_DOWN";
    if (canIdle) {
      await prisma.machine.update({ where: { id: report.machineId }, data: { status: "IDLE" } });
    }
  }
  revalidatePath("/admin/breakdowns");
  return { success: true };
}
