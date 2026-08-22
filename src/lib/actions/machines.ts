"use server";
import { prisma } from "@/lib/prisma";
import { getActionAdmin } from "@/lib/auth-guards";
import { machineSchema } from "@/lib/validations/machine";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMachine(prevState: unknown, formData: FormData) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized — OWNER/ADMIN only" };
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) raw[k] = v;
  // coerce empty strings to undefined for optional numbers
  if (raw.manufacturingYear === "") delete raw.manufacturingYear;
  if (raw.purchasePrice === "") delete raw.purchasePrice;
  if (raw.expectedFuelEfficiency === "") delete raw.expectedFuelEfficiency;
  if (raw.serviceIntervalHours === "") delete raw.serviceIntervalHours;
  const parsed = machineSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  }
  const data = parsed.data;
  try {
    await prisma.machine.create({
      data: {
        name: data.name,
        registrationNumber: data.registrationNumber,
        machineType: data.machineType as never,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        manufacturingYear: data.manufacturingYear ?? null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate as string) : null,
        purchasePrice: data.purchasePrice ?? null,
        currentHourMeter: data.currentHourMeter,
        expectedFuelEfficiency: data.expectedFuelEfficiency ?? null,
        serviceIntervalHours: data.serviceIntervalHours ?? 500,
        status: data.status as never,
        notes: data.notes || null,
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) return { error: "Registration number already exists" };
    return { error: msg };
  }
  revalidatePath("/admin/machines");
  redirect("/admin/machines");
}

export async function updateMachine(id: string, prevState: unknown, formData: FormData) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  const raw: Record<string, unknown> = {};
  for (const [k,v] of formData.entries()) raw[k]=v;
  if (raw.manufacturingYear === "") delete raw.manufacturingYear;
  if (raw.purchasePrice === "") delete raw.purchasePrice;
  if (raw.expectedFuelEfficiency === "") delete raw.expectedFuelEfficiency;
  if (raw.serviceIntervalHours === "") delete raw.serviceIntervalHours;
  const parsed = machineSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const data = parsed.data;
  try {
    await prisma.machine.update({
      where: { id },
      data: {
        name: data.name,
        registrationNumber: data.registrationNumber,
        machineType: data.machineType as never,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        manufacturingYear: data.manufacturingYear ?? null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate as string) : null,
        purchasePrice: data.purchasePrice ?? null,
        currentHourMeter: data.currentHourMeter,
        expectedFuelEfficiency: data.expectedFuelEfficiency ?? null,
        serviceIntervalHours: data.serviceIntervalHours ?? 500,
        status: data.status as never,
        notes: data.notes || null,
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) return { error: "Registration number already exists" };
    return { error: msg };
  }
  revalidatePath("/admin/machines");
  revalidatePath(`/admin/machines/${id}`);
  redirect(`/admin/machines/${id}`);
}

export async function archiveMachine(id: string) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  await prisma.machine.update({ where: { id }, data: { status: "RETIRED" } });
  revalidatePath("/admin/machines");
  return { success: true };
}

export async function deleteMachine(id: string) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  const machine = await prisma.machine.findUnique({ where: { id }, select: { id: true, name: true, status: true } });
  if (!machine) return { error: "Machine not found" };

  // Block if actively assigned or has an active work session
  const [activeAssignment, activeSession] = await Promise.all([
    prisma.assignment.count({ where: { machineId: id, status: "ACTIVE" } }),
    prisma.workSession.count({ where: { machineId: id, status: "ACTIVE" } }),
  ]);
  if (activeAssignment > 0) return { error: "Cannot delete: machine has an active assignment. End the assignment or retire the machine first." };
  if (activeSession > 0) return { error: "Cannot delete: machine has an active work session." };

  // If any history exists, soft-retire instead of hard delete to preserve audit/financial trail
  const [workSessions, fuelLogs, maintenance, breakdowns, expenses, revenues, assignments] = await Promise.all([
    prisma.workSession.count({ where: { machineId: id } }),
    prisma.fuelLog.count({ where: { machineId: id } }),
    prisma.maintenanceRecord.count({ where: { machineId: id } }),
    prisma.breakdownReport.count({ where: { machineId: id } }),
    prisma.expense.count({ where: { machineId: id } }),
    prisma.revenue.count({ where: { machineId: id } }),
    prisma.assignment.count({ where: { machineId: id } }),
  ]);
  const hasHistory = workSessions + fuelLogs + maintenance + breakdowns + expenses + revenues + assignments > 0;
  if (hasHistory) {
    if (machine.status === "RETIRED") {
      return { error: "Machine already retired — has history and cannot be hard-deleted." };
    }
    await prisma.machine.update({ where: { id }, data: { status: "RETIRED" } });
    revalidatePath("/admin/machines");
    revalidatePath(`/admin/machines/${id}`);
    return { success: true, message: "Machine retired (has history, preserved)" };
  }

  try {
    await prisma.machine.delete({ where: { id } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Fallback: if FK prevents delete, retire
    if (msg.includes("Foreign key") || msg.includes("violates")) {
      await prisma.machine.update({ where: { id }, data: { status: "RETIRED" } });
      revalidatePath("/admin/machines");
      return { success: true, message: "Machine retired (linked records prevented hard delete)" };
    }
    return { error: msg };
  }
  revalidatePath("/admin/machines");
  return { success: true };
}