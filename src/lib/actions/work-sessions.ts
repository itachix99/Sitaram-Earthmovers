"use server";
import { prisma } from "@/lib/prisma";
import { getActionUser } from "@/lib/auth-guards";
import { Prisma } from "@prisma/client";
import { startWorkSchema, endWorkSchema } from "@/lib/validations/work-session";
import { revalidatePath } from "next/cache";

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function startWork(prevState: unknown, formData: FormData) {
  const user = await getActionUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;

  const raw = {
    machineId: formData.get("machineId") as string,
    jobSiteId: (formData.get("jobSiteId") as string) || "",
    openingHourMeter: formData.get("openingHourMeter") as string,
    notes: (formData.get("notes") as string) || "",
    startPhotoUrl: (formData.get("startPhotoUrl") as string) || "",
  };
  const parsed = startWorkSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const { machineId, jobSiteId, openingHourMeter, notes } = parsed.data;

  // Check machine exists
  const machine = await prisma.machine.findUnique({ where: { id: machineId } });
  if (!machine) return { error: "Machine not found" };
  if (machine.status === "RETIRED") return { error: "Machine retired" };

  // Prevent duplicate active sessions per operator and per machine
  const [activeByOperator, activeByMachine] = await Promise.all([
    prisma.workSession.findFirst({ where: { operatorId: userId, status: "ACTIVE" } }),
    prisma.workSession.findFirst({ where: { machineId, status: "ACTIVE" } }),
  ]);
  if (activeByOperator) return { error: "You already have an active session. End it before starting new." };
  if (activeByMachine) return { error: "Machine already has an active session by another operator." };

  // Validate opening meter >= currentHourMeter (allow small tolerance for manual)
  if (openingHourMeter < machine.currentHourMeter - 0.5) {
    return { error: `Opening meter (${openingHourMeter}) cannot be less than current meter (${machine.currentHourMeter})` };
  }

  // Assignment enforcement: operators may only start work on machines they
  // are actively assigned to; the assignment's site is the source of truth.
  let effectiveJobSiteId: string | null = jobSiteId || null;
  if (user.role === "OPERATOR") {
    const assignment = await prisma.assignment.findFirst({
      where: { operatorId: userId, machineId, status: "ACTIVE" },
      include: { jobSite: true },
    });
    if (!assignment) {
      return { error: "You are not actively assigned to this machine. Ask your admin for an assignment." };
    }
    effectiveJobSiteId = assignment.jobSiteId;
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Re-check duplicates inside the transaction; the DB-level partial unique
      // indexes (one ACTIVE session per machine / per operator) are the backstop.
      const activeByOperator = await tx.workSession.findFirst({ where: { operatorId: userId, status: "ACTIVE" }, select: { id: true } });
      if (activeByOperator) throw new Error("You already have an active session. End it before starting a new one.");
      const activeByMachine = await tx.workSession.findFirst({ where: { machineId, status: "ACTIVE" }, select: { id: true } });
      if (activeByMachine) throw new Error("Machine already has an active session by another operator.");

      await tx.machine.update({ where: { id: machineId }, data: { status: "WORKING" } });

      return tx.workSession.create({
        data: {
          machineId,
          operatorId: userId,
          jobSiteId: effectiveJobSiteId,
          openingHourMeter,
          notes: notes || null,
          startPhotoUrl: parsed.data.startPhotoUrl || null,
          status: "ACTIVE",
        },
      });
    });
    revalidatePath("/operator/today");
    revalidatePath(`/admin/machines/${machineId}`);
    return { success: true, sessionId: created.id };
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return { error: "Machine already has an active session by another operator." };
    }
    return { error: e instanceof Error ? e.message : "Could not start work" };
  }
}

export async function endWork(prevState: unknown, formData: FormData) {
  const user = await getActionUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;

  const raw = {
    sessionId: formData.get("sessionId") as string,
    closingHourMeter: formData.get("closingHourMeter") as string,
    fuelUsed: (formData.get("fuelUsed") as string) || undefined,
    notes: (formData.get("notes") as string) || "",
    endPhotoUrl: (formData.get("endPhotoUrl") as string) || "",
  };
  // coerce fuelUsed empty to undefined
  if (raw.fuelUsed === "") delete (raw as Record<string,unknown>).fuelUsed;
  const parsed = endWorkSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const { sessionId, closingHourMeter, fuelUsed, notes, endPhotoUrl } = parsed.data;

  const work = await prisma.workSession.findUnique({ where: { id: sessionId } });
  if (!work) return { error: "Session not found" };
  if (work.operatorId !== userId) {
    if (user.role !== "OWNER" && user.role !== "ADMIN") return { error: "Not your session" };
  }
  if (work.status === "COMPLETED") return { error: "Already completed" };
  if (closingHourMeter < work.openingHourMeter) return { error: `Closing meter (${closingHourMeter}) must be ≥ opening (${work.openingHourMeter})` };

  const workingHours = Number((closingHourMeter - work.openingHourMeter).toFixed(2));
  if (workingHours > 24) return { error: "Working hours cannot exceed 24h per session (check meters)" };

  await prisma.$transaction(async (tx)=>{
    await tx.workSession.update({
      where: { id: sessionId },
      data: {
        closingHourMeter,
        workingHours,
        fuelUsed: fuelUsed ?? null,
        notes: notes ? (work.notes ? `${work.notes}\n${notes}` : notes) : work.notes,
        endPhotoUrl: endPhotoUrl || null,
        endTime: new Date(),
        status: "COMPLETED",
      }
    });
    // Update machine currentHourMeter to closing. Safety-aware: never clear
    // breakdown/maintenance state just because a session ended.
    const current = await tx.machine.findUnique({ where: { id: work.machineId }, select: { status: true } });
    const preserved = current?.status === "BROKEN_DOWN" || current?.status === "UNDER_MAINTENANCE";
    await tx.machine.update({
      where: { id: work.machineId },
      data: { currentHourMeter: closingHourMeter, ...(preserved ? {} : { status: "IDLE" }) },
    });
  });

  revalidatePath("/operator/today");
  revalidatePath(`/admin/machines/${work.machineId}`);
  return { success: true, workingHours };
}
