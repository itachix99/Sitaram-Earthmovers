"use server";
import { prisma } from "@/lib/prisma";
import { getActionAdmin } from "@/lib/auth-guards";
import { operatorCreateSchema, operatorUpdateSchema } from "@/lib/validations/operator";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOperator(prevState: unknown, formData: FormData) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized — OWNER/ADMIN only" };
  const raw: Record<string, unknown> = {};
  for (const [k,v] of formData.entries()) raw[k]=v;
  if (raw.salaryAmount === "") delete raw.salaryAmount;
  const parsed = operatorCreateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  const hash = await bcrypt.hash(d.password, 10);
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: d.name,
          phone: d.phone,
          email: d.email || null,
          passwordHash: hash,
          role: "OPERATOR",
          status: d.status as never,
        }
      });
      await tx.operator.create({
        data: {
          userId: user.id,
          licenseNumber: d.licenseNumber || null,
          licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry as string) : null,
          joiningDate: d.joiningDate ? new Date(d.joiningDate as string) : null,
          salaryType: d.salaryType as never,
          salaryAmount: d.salaryAmount ?? null,
          status: d.status as never,
        }
      });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) return { error: "Phone or email already exists" };
    return { error: msg };
  }
  revalidatePath("/admin/operators");
  redirect("/admin/operators");
}

export async function updateOperator(id: string, prevState: unknown, formData: FormData) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  const raw: Record<string, unknown> = {};
  for (const [k,v] of formData.entries()) raw[k]=v;
  if (raw.salaryAmount === "") delete raw.salaryAmount;
  const parsed = operatorUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  const operator = await prisma.operator.findUnique({ where: { id }, include: { user: true } });
  if (!operator) return { error: "Operator not found" };
  try {
    await prisma.$transaction(async (tx)=>{
      const userData: Record<string, unknown> = {
        name: d.name,
        phone: d.phone,
        email: d.email || null,
        status: d.status,
      };
      if (d.password) userData.passwordHash = await bcrypt.hash(d.password as string, 10);
      await tx.user.update({ where: { id: operator.userId }, data: userData as never });
      await tx.operator.update({ where: { id }, data: {
        licenseNumber: d.licenseNumber || null,
        licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry as string) : null,
        joiningDate: d.joiningDate ? new Date(d.joiningDate as string) : null,
        salaryType: d.salaryType as never,
        salaryAmount: d.salaryAmount ?? null,
        status: d.status as never,
      }});
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) return { error: "Phone or email already exists" };
    return { error: msg };
  }
  revalidatePath("/admin/operators");
  revalidatePath(`/admin/operators/${id}`);
  redirect(`/admin/operators/${id}`);
}

export async function toggleOperatorStatus(id: string) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  const op = await prisma.operator.findUnique({ where: { id }, include: { user: true } });
  if (!op) return { error: "Not found" };
  const newStatus = op.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.$transaction(async (tx)=>{
    await tx.operator.update({ where: { id }, data: { status: newStatus as never } });
    await tx.user.update({ where: { id: op.userId }, data: { status: newStatus as never } });
  });
  revalidatePath("/admin/operators");
  return { success: true };
}

export async function deleteOperator(id: string) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  const op = await prisma.operator.findUnique({ where: { id }, include: { user: true } });
  if (!op) return { error: "Operator not found" };

  // Block if operator is actively assigned or has an active session
  const [activeAssignment, activeSession] = await Promise.all([
    prisma.assignment.count({ where: { operatorId: op.userId, status: "ACTIVE" } }),
    prisma.workSession.count({ where: { operatorId: op.userId, status: "ACTIVE" } }),
  ]);
  if (activeAssignment > 0) return { error: "Cannot delete: operator has an active assignment. End the assignment or deactivate first." };
  if (activeSession > 0) return { error: "Cannot delete: operator has an active work session." };

  const [workSessions, fuelLogs, breakdowns, assignments, auditLogs] = await Promise.all([
    prisma.workSession.count({ where: { operatorId: op.userId } }),
    prisma.fuelLog.count({ where: { operatorId: op.userId } }),
    prisma.breakdownReport.count({ where: { operatorId: op.userId } }),
    prisma.assignment.count({ where: { operatorId: op.userId } }),
    prisma.auditLog.count({ where: { actorId: op.userId } }),
  ]);
  const hasHistory = workSessions + fuelLogs + breakdowns + assignments + auditLogs > 0;
  if (hasHistory) {
    // Soft-deactivate: preserve history, flip both Operator and User to INACTIVE
    if (op.status === "INACTIVE" && op.user.status === "INACTIVE") {
      return { error: "Operator already deactivated — has history and cannot be hard-deleted." };
    }
    await prisma.$transaction(async (tx) => {
      await tx.operator.update({ where: { id }, data: { status: "INACTIVE" as never } });
      await tx.user.update({ where: { id: op.userId }, data: { status: "INACTIVE" as never } });
    });
    revalidatePath("/admin/operators");
    revalidatePath(`/admin/operators/${id}`);
    return { success: true, message: "Operator deactivated (has history, preserved)" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.operator.delete({ where: { id } });
      await tx.user.delete({ where: { id: op.userId } });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Foreign key") || msg.includes("violates")) {
      await prisma.$transaction(async (tx) => {
        await tx.operator.update({ where: { id }, data: { status: "INACTIVE" as never } });
        await tx.user.update({ where: { id: op.userId }, data: { status: "INACTIVE" as never } });
      });
      revalidatePath("/admin/operators");
      return { success: true, message: "Operator deactivated (linked records prevented hard delete)" };
    }
    return { error: msg };
  }
  revalidatePath("/admin/operators");
  return { success: true };
}
