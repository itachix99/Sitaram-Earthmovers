"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { expenseSchema } from "@/lib/validations/expense";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const s = await auth();
  const r = (s?.user as unknown as { role?: string })?.role;
  if (!s?.user) throw new Error("UNAUTHORIZED");
  if (r !== "OWNER" && r !== "ADMIN") throw new Error("FORBIDDEN");
  return s;
}

export async function createExpense(prevState: unknown, formData: FormData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let session: any;
  try { session = await requireAdmin(); } catch { return { error: "Not authorized — OWNER/ADMIN only" }; }
  const raw: Record<string, unknown> = {
    category: formData.get("category") as string,
    amount: formData.get("amount") as string,
    machineId: (formData.get("machineId") as string) || "",
    jobSiteId: (formData.get("jobSiteId") as string) || "",
    description: (formData.get("description") as string) || "",
    date: (formData.get("date") as string) || "",
  };
  if (raw.machineId === "") delete raw.machineId;
  if (raw.jobSiteId === "") delete raw.jobSiteId;
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  await prisma.expense.create({
    data: {
      category: d.category as never,
      amount: d.amount,
      machineId: d.machineId || null,
      jobSiteId: d.jobSiteId || null,
      description: d.description || null,
      date: d.date ? new Date(d.date as string) : new Date(),
      createdById: (session?.user as unknown as { id: string }).id,
    }
  });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/revenue");
  if (d.machineId) revalidatePath(`/admin/machines/${d.machineId}`);
  if (d.jobSiteId) revalidatePath(`/admin/projects/${d.jobSiteId}`);
  return { success: true };
}
