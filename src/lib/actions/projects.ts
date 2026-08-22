"use server";
import { prisma } from "@/lib/prisma";
import { getActionAdmin } from "@/lib/auth-guards";
import { projectSchema } from "@/lib/validations/project";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(prevState: unknown, formData: FormData) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized — OWNER/ADMIN only" };
  const raw: Record<string, unknown> = {};
  for (const [k,v] of formData.entries()) raw[k]=v;
  if (raw.latitude === "") delete raw.latitude;
  if (raw.longitude === "") delete raw.longitude;
  if (raw.rate === "") delete raw.rate;
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  try {
    await prisma.jobSite.create({
      data: {
        name: d.name,
        clientName: d.clientName || null,
        clientPhone: d.clientPhone || null,
        address: d.address || null,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        startDate: d.startDate ? new Date(d.startDate as string) : null,
        expectedEndDate: d.expectedEndDate ? new Date(d.expectedEndDate as string) : null,
        status: d.status as never,
        billingType: d.billingType as never,
        rate: d.rate ?? null,
        notes: d.notes || null,
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function updateProject(id: string, prevState: unknown, formData: FormData) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  const raw: Record<string, unknown> = {};
  for (const [k,v] of formData.entries()) raw[k]=v;
  if (raw.latitude === "") delete raw.latitude;
  if (raw.longitude === "") delete raw.longitude;
  if (raw.rate === "") delete raw.rate;
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map(i=>i.message).join(", ") };
  const d = parsed.data;
  try {
    await prisma.jobSite.update({
      where: { id },
      data: {
        name: d.name,
        clientName: d.clientName || null,
        clientPhone: d.clientPhone || null,
        address: d.address || null,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        startDate: d.startDate ? new Date(d.startDate as string) : null,
        expectedEndDate: d.expectedEndDate ? new Date(d.expectedEndDate as string) : null,
        status: d.status as never,
        billingType: d.billingType as never,
        rate: d.rate ?? null,
        notes: d.notes || null,
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  redirect(`/admin/projects/${id}`);
}

export async function archiveProject(id: string) {
  const admin = await getActionAdmin();
  if (!admin) return { error: "Not authorized" };
  await prisma.jobSite.update({ where: { id }, data: { status: "COMPLETED" } });
  revalidatePath("/admin/projects");
  return { success: true };
}
