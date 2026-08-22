"use server";
import { prisma } from "@/lib/prisma";
import { getActionAdmin } from "@/lib/auth-guards";
import { assignmentSchema } from "@/lib/validations/project";
import { revalidatePath } from "next/cache";

export async function createAssignment(prevState: unknown, formData: FormData) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  const raw = {
    machineId: formData.get("machineId") as string,
    operatorId: formData.get("operatorId") as string,
    jobSiteId: formData.get("jobSiteId") as string,
  };
  const parsed = assignmentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const { machineId, operatorId, jobSiteId } = parsed.data;

  // Validate existence
  const [machine, operator, site] = await Promise.all([
    prisma.machine.findUnique({ where: { id: machineId } }),
    prisma.user.findUnique({ where: { id: operatorId } }),
    prisma.jobSite.findUnique({ where: { id: jobSiteId } }),
  ]);
  if (!machine) return { error: "Machine not found" };
  if (!operator) return { error: "Operator not found" };
  if (!site) return { error: "Site not found" };
  if (operator.role !== "OPERATOR") return { error: "User is not an operator" };

  // End previous active assignment for this machine (preserve history)
  const active = await prisma.assignment.findFirst({ where: { machineId, status: "ACTIVE" } });
  if (active) {
    await prisma.assignment.update({ where: { id: active.id }, data: { status: "COMPLETED", endedAt: new Date() } });
  }

  await prisma.assignment.create({
    data: { machineId, operatorId, jobSiteId, status: "ACTIVE" }
  });
  revalidatePath(`/admin/projects/${jobSiteId}`);
  revalidatePath(`/admin/machines/${machineId}`);
  revalidatePath(`/admin/operators`);
  return { success: true };
}

export async function endAssignment(id: string) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  const a = await prisma.assignment.findUnique({ where: { id } });
  if (!a) return { error: "Assignment not found" };
  if (a.status === "COMPLETED") return { error: "Already completed" };
  await prisma.assignment.update({ where: { id }, data: { status: "COMPLETED", endedAt: new Date() } });
  revalidatePath(`/admin/projects/${a.jobSiteId}`);
  revalidatePath("/admin/projects");
  return { success: true };
}
