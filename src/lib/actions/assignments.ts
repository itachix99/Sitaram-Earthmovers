"use server";
import { prisma } from "@/lib/prisma";
import { getActionAdmin } from "@/lib/auth-guards";
import { assignmentSchema } from "@/lib/validations/project";
import { Prisma } from "@prisma/client";
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
  if (operator.status !== "ACTIVE") return { error: "Operator is not active" };
  if (machine.status === "RETIRED") return { error: "Machine is retired" };

  try {
    await prisma.$transaction(async (tx) => {
      // End previous active assignment for this machine (preserve history).
      const active = await tx.assignment.findFirst({ where: { machineId, status: "ACTIVE" }, select: { id: true } });
      if (active) {
        await tx.assignment.update({ where: { id: active.id }, data: { status: "COMPLETED", endedAt: new Date() } });
      }
      // The partial unique index on ACTIVE assignments per machine is the
      // concurrency backstop for two admins assigning simultaneously.
      await tx.assignment.create({
        data: { machineId, operatorId, jobSiteId, status: "ACTIVE" }
      });
    });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Machine was just assigned by someone else. Refresh and retry." };
    }
    throw e;
  }
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
