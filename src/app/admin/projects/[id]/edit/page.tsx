import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.jobSite.findUnique({ where: { id } });
  if (!site) notFound();
  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" asChild><Link href={`/admin/projects/${site.id}`}><ArrowLeft className="h-4 w-4" /> Back to {site.name}</Link></Button>
      <div><h1 className="text-2xl font-bold tracking-tight">Edit {site.name}</h1><p className="text-sm text-muted-foreground">{site.clientName ?? "—"} • {site.address ?? "—"}</p></div>
      <ProjectForm project={{
        id: site.id,
        name: site.name,
        clientName: site.clientName,
        clientPhone: site.clientPhone,
        address: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        startDate: site.startDate ? site.startDate.toISOString() : null,
        expectedEndDate: site.expectedEndDate ? site.expectedEndDate.toISOString() : null,
        status: site.status,
        billingType: site.billingType,
        rate: site.rate,
        notes: site.notes,
      }} />
    </div>
  );
}
