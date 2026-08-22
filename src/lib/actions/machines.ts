"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { machineSchema } from "@/lib/validations/machine";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string })?.role;
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("FORBIDDEN");
  return session;
}

export async function createMachine(prevState: unknown, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized — OWNER/ADMIN only" };
  }
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
  try { await requireAdmin(); } catch { return { error: "Not authorized" }; }
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
  try { await requireAdmin(); } catch { return { error: "Not authorized" }; }
  await prisma.machine.update({ where: { id }, data: { status: "RETIRED" } });
  revalidatePath("/admin/machines");
  return { success: true };
}

export async function deleteMachine(id: string) {
  try { await requireAdmin(); } catch { return { error: "Not authorized" }; }
  // Prevent hard delete if has history — soft retire instead
  const count = await prisma.workSession.count({ where: { machineId: id } });
  if (count > 0) {
    await prisma.machine.update({ where: { id }, data: { status: "RETIRED" } });
    revalidatePath("/admin/machines");
    return { success: true, message: "Machine retired (has history, not deleted)" };
  }
  await prisma.machine.delete({ where: { id } });
  revalidatePath("/admin/machines");
  return { success: true };
}
