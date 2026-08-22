import { requireActiveUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel } from "lucide-react";
import { FuelForm } from "@/components/fuel/fuel-form";

export default async function FuelPage() {
  const user = await requireActiveUser();
  const userId = user.id;
  const assignment = await prisma.assignment.findFirst({ where: { operatorId: userId, status: "ACTIVE" }, include: { machine: true, jobSite: true } });
  const machines = await prisma.machine.findMany({ where: { status: { not: "RETIRED" } }, select: { id: true, name: true, registrationNumber: true }, orderBy: { name: "asc" } });
  const jobSites = await prisma.jobSite.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const recent = await prisma.fuelLog.findMany({ where: { operatorId: userId }, orderBy: { date: "desc" }, take: 5, include: { machine: true } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2"><Fuel className="h-5 w-5" /> Add Fuel</h1>
      <Card>
        <CardHeader><CardTitle>Fuel Log</CardTitle></CardHeader>
        <CardContent>
          <FuelForm machines={machines} jobSites={jobSites} defaultMachineId={assignment?.machineId} defaultJobSiteId={assignment?.jobSiteId ?? null} currentMeter={assignment?.machine.currentHourMeter} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent Fuel Logs</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recent.length===0 ? <p className="text-muted-foreground">No fuel logs yet</p> : recent.map(f=>(
            <div key={f.id} className="flex justify-between border-b py-2 last:border-0">
              <span>{new Date(f.date).toLocaleDateString()} • {f.machine.name} • {f.litres} L {f.totalCost ? `• ₹${f.totalCost}` : ""}</span>
              <span className="font-mono text-xs">{f.meterReading ? `${f.meterReading} h` : "—"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
