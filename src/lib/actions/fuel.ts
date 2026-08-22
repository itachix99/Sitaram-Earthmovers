"use server";
import { prisma } from "@/lib/prisma";
import { getActionUser } from "@/lib/auth-guards";
import { fuelSchema } from "@/lib/validations/fuel";
import { revalidatePath } from "next/cache";

export async function createFuelLog(prevState: unknown, formData: FormData) {
  const user = await getActionUser();
  if (!user) return { error: "Not authenticated" };

  const raw: Record<string, unknown> = {
    machineId: formData.get("machineId") as string,
    litres: formData.get("litres") as string,
    costPerLitre: (formData.get("costPerLitre") as string) || undefined,
    meterReading: (formData.get("meterReading") as string) || undefined,
    fuelStation: (formData.get("fuelStation") as string) || "",
    notes: (formData.get("notes") as string) || "",
    date: (formData.get("date") as string) || "",
    jobSiteId: (formData.get("jobSiteId") as string) || "",
  };
  if (raw.costPerLitre === "") delete raw.costPerLitre;
  if (raw.meterReading === "") delete raw.meterReading;
  if (raw.jobSiteId === "") delete raw.jobSiteId;
  if (raw.fuelStation === "") raw.fuelStation = "";
  
  const parsed = fuelSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const { machineId, litres, costPerLitre, meterReading, fuelStation, notes, date, jobSiteId } = parsed.data;

  const machine = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!machine) return { error: "Machine not found" };

  // Operators may only log fuel for machines they are actively assigned to.
  if (user.role === "OPERATOR") {
    const assigned = await prisma.assignment.findFirst({
      where: { operatorId: user.id, machineId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!assigned) return { error: "You can only log fuel for your assigned machine." };
  }

  // Validate meterReading not less than current if provided? Allow but warn
  if (meterReading !== undefined && meterReading < 0) return { error: "Meter reading must be ≥ 0" };

  const totalCost = costPerLitre ? Number((litres * costPerLitre).toFixed(2)) : null;
  const logDate = date ? new Date(date as string) : new Date();

  await prisma.fuelLog.create({
    data: {
      machineId,
      operatorId: user.id,
      jobSiteId: jobSiteId || null,
      litres,
      costPerLitre: costPerLitre ?? null,
      totalCost,
      meterReading: meterReading ?? null,
      fuelStation: fuelStation || null,
      notes: notes || null,
      date: logDate,
    }
  });
  revalidatePath("/admin/fuel");
  revalidatePath("/operator/fuel");
  revalidatePath(`/admin/machines/${machineId}`);
  return { success: true };
}
