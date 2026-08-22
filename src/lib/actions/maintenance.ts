"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { maintenanceSchema } from "@/lib/validations/maintenance";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string })?.role;
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("FORBIDDEN");
}

export async function createMaintenance(prevState: unknown, formData: FormData) {
  try { await requireAdmin(); } catch { return { error: "Not authorized — OWNER/ADMIN only" }; }
  const raw: Record<string, unknown> = {
    machineId: formData.get("machineId") as string,
    serviceType: (formData.get("serviceType") as string) || "SCHEDULED",
    description: (formData.get("description") as string) || "",
    meterReading: (formData.get("meterReading") as string) || undefined,
    serviceDate: (formData.get("serviceDate") as string) || "",
    nextServiceHours: (formData.get("nextServiceHours") as string) || undefined,
    nextServiceDate: (formData.get("nextServiceDate") as string) || "",
    partsCost: (formData.get("partsCost") as string) || undefined,
    laborCost: (formData.get("laborCost") as string) || undefined,
    serviceProvider: (formData.get("serviceProvider") as string) || "",
    notes: (formData.get("notes") as string) || "",
  };
  if (raw.meterReading === "") delete raw.meterReading;
  if (raw.nextServiceHours === "") delete raw.nextServiceHours;
  if (raw.partsCost === "") delete raw.partsCost;
  if (raw.laborCost === "") delete raw.laborCost;
  const parsed = maintenanceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  const machine = await prisma.machine.findUnique({ where: { id: d.machineId } });
  if (!machine) return { error: "Machine not found" };
  const totalCost = (d.partsCost ?? 0) + (d.laborCost ?? 0);
  const serviceDate = d.serviceDate ? new Date(d.serviceDate as string) : new Date();
  await prisma.$transaction(async(tx)=>{
    await tx.maintenanceRecord.create({
      data: {
        machineId: d.machineId,
        serviceType: d.serviceType as never,
        description: d.description || null,
        meterReading: d.meterReading ?? machine.currentHourMeter,
        serviceDate,
        nextServiceHours: d.nextServiceHours ?? null,
        nextServiceDate: d.nextServiceDate ? new Date(d.nextServiceDate as string) : null,
        partsCost: d.partsCost ?? 0,
        laborCost: d.laborCost ?? 0,
        totalCost,
        serviceProvider: d.serviceProvider || null,
        notes: d.notes || null,
      }
    });
    // Update machine last service
    await tx.machine.update({
      where: { id: d.machineId },
      data: {
        lastServiceAt: serviceDate,
        lastServiceMeter: d.meterReading ?? machine.currentHourMeter,
        status: machine.status === "UNDER_MAINTENANCE" ? "ACTIVE" : machine.status,
      }
    });
  });
  revalidatePath("/admin/maintenance");
  revalidatePath(`/admin/machines/${d.machineId}`);
  return { success: true };
}
