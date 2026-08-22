import { requireActiveUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { ReportForm } from "@/components/breakdowns/report-form";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ machineId?: string }> }) {
  const user = await requireActiveUser();
  const { machineId } = await searchParams;
  const isPrivileged = user.role !== "OPERATOR";
  const machines = isPrivileged
    ? await prisma.machine.findMany({ where: { status: { not: "RETIRED" } }, select: { id: true, name: true, registrationNumber: true }, orderBy: { name: "asc" } })
    : (await prisma.assignment.findMany({ where: { operatorId: user.id, status: "ACTIVE" }, include: { machine: { select: { id: true, name: true, registrationNumber: true } } }, orderBy: { assignedAt: "desc" } })).map((a) => a.machine);
  const assignment = await prisma.assignment.findFirst({ where: { operatorId: user.id, status: "ACTIVE" }, include: { machine: true } });
  const defaultMachineId = machineId ?? assignment?.machineId ?? "";
  const recent = await prisma.breakdownReport.findMany({ where: { operatorId: user.id }, orderBy: { reportedAt: "desc" }, take: 5, include: { machine: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Report Breakdown</h1>
      <ReportForm machines={machines} defaultMachineId={defaultMachineId} />
      <Card>
        <CardHeader><CardTitle>Recent Reports</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recent.length===0 ? <p className="text-muted-foreground">No reports yet</p> : recent.map(r=>(
            <div key={r.id} className="flex justify-between border-b py-2 last:border-0"><span>{r.machine.name} • {r.issue} • {r.severity}</span><span className="text-xs">{new Date(r.reportedAt).toLocaleDateString()} • {r.status}</span></div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
