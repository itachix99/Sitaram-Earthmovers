import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OperatorForm } from "@/components/operators/operator-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guards";

export default async function EditOperatorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const op = await prisma.operator.findUnique({ where: { id }, include: { user: true } });
  if (!op) notFound();
  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" asChild><Link href={`/admin/operators/${op.id}`}><ArrowLeft className="h-4 w-4" /> Back to {op.user.name}</Link></Button>
      <div><h1 className="text-2xl font-bold tracking-tight">Edit {op.user.name}</h1><p className="text-sm text-muted-foreground">{op.user.phone} • {op.licenseNumber ?? "No license"}</p></div>
      <OperatorForm operator={{
        id: op.id,
        name: op.user.name,
        phone: op.user.phone,
        email: op.user.email,
        licenseNumber: op.licenseNumber,
        licenseExpiry: op.licenseExpiry ? op.licenseExpiry.toISOString() : null,
        joiningDate: op.joiningDate ? op.joiningDate.toISOString() : null,
        salaryType: op.salaryType,
        salaryAmount: op.salaryAmount,
        status: op.status,
      }} />
    </div>
  );
}
