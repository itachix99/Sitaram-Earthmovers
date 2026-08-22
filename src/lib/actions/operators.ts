"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { operatorCreateSchema, operatorUpdateSchema } from "@/lib/validations/operator";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string })?.role;
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (role !== "OWNER" && role !== "ADMIN") throw new Error("FORBIDDEN");
}

export async function createOperator(prevState: unknown, formData: FormData) {
  try { await requireAdmin(); } catch { return { error: "Not authorized — OWNER/ADMIN only" }; }
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
  try { await requireAdmin(); } catch { return { error: "Not authorized" }; }
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
  try { await requireAdmin(); } catch { return { error: "Not authorized" }; }
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
