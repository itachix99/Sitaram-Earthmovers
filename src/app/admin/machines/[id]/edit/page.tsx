import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MachineForm } from "@/components/machines/machine-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guards";

export default async function EditMachinePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const m = await prisma.machine.findUnique({ where: { id } });
  if (!m) notFound();
  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" asChild><Link href={`/admin/machines/${m.id}`}><ArrowLeft className="h-4 w-4" /> Back to {m.name}</Link></Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit {m.name}</h1>
        <p className="text-sm text-muted-foreground">{m.registrationNumber} • {m.machineType}</p>
      </div>
      <MachineForm machine={{
        id: m.id,
        name: m.name,
        registrationNumber: m.registrationNumber,
        machineType: m.machineType,
        manufacturer: m.manufacturer,
        model: m.model,
        manufacturingYear: m.manufacturingYear,
        purchaseDate: m.purchaseDate ? m.purchaseDate.toISOString() : null,
        purchasePrice: m.purchasePrice,
        currentHourMeter: m.currentHourMeter,
        expectedFuelEfficiency: m.expectedFuelEfficiency,
        serviceIntervalHours: m.serviceIntervalHours,
        status: m.status,
        notes: m.notes,
      }} />
    </div>
  );
}
