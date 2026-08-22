"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revenueSchema } from "@/lib/validations/revenue";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const s = await auth();
  const r = (s?.user as unknown as { role?: string })?.role;
  if (!s?.user) throw new Error("UNAUTHORIZED");
  if (r !== "OWNER" && r !== "ADMIN") throw new Error("FORBIDDEN");
}

export async function createRevenue(prevState: unknown, formData: FormData) {
  try { await requireAdmin(); } catch { return { error: "Not authorized — OWNER/ADMIN only" }; }
  const raw: Record<string, unknown> = {
    invoiceNumber: formData.get("invoiceNumber") as string,
    jobSiteId: (formData.get("jobSiteId") as string) || "",
    machineId: (formData.get("machineId") as string) || "",
    amount: formData.get("amount") as string,
    amountReceived: (formData.get("amountReceived") as string) || undefined,
    paymentStatus: (formData.get("paymentStatus") as string) || "PENDING",
    billingStart: (formData.get("billingStart") as string) || "",
    billingEnd: (formData.get("billingEnd") as string) || "",
    clientName: (formData.get("clientName") as string) || "",
    notes: (formData.get("notes") as string) || "",
  };
  if (raw.amountReceived === "") delete raw.amountReceived;
  if (raw.jobSiteId === "") delete raw.jobSiteId;
  if (raw.machineId === "") delete raw.machineId;
  const parsed = revenueSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  try {
    await prisma.revenue.create({
      data: {
        invoiceNumber: d.invoiceNumber,
        jobSiteId: d.jobSiteId || null,
        machineId: d.machineId || null,
        amount: d.amount,
        amountReceived: d.amountReceived ?? 0,
        paymentStatus: d.paymentStatus as never,
        billingStart: d.billingStart ? new Date(d.billingStart as string) : null,
        billingEnd: d.billingEnd ? new Date(d.billingEnd as string) : null,
        clientName: d.clientName || null,
        notes: d.notes || null,
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) return { error: "Invoice number already exists" };
    return { error: msg };
  }
  revalidatePath("/admin/revenue");
  revalidatePath("/admin/expenses");
  if (d.jobSiteId) revalidatePath(`/admin/projects/${d.jobSiteId}`);
  if (d.machineId) revalidatePath(`/admin/machines/${d.machineId}`);
  return { success: true };
}
