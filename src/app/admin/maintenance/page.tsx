export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";

export default async function MaintenancePage() {
  const machines = await prisma.machine.findMany({ select: { id: true, name: true, registrationNumber: true, currentHourMeter: true, lastServiceMeter: true, lastServiceAt: true, serviceIntervalHours: true, status: true }, orderBy: { name: "asc" } });
  const records = await prisma.maintenanceRecord.findMany({ include: { machine: true }, orderBy: { serviceDate: "desc" }, take: 20 });

  const alerts = machines.map(m=>{
    const next = (m.lastServiceMeter ?? 0) + (m.serviceIntervalHours ?? 500);
    const remaining = next - m.currentHourMeter;
    let state: "ok"|"approaching"|"overdue" = "ok";
    if (remaining <= 0) state = "overdue";
    else if (remaining <= 100) state = "approaching";
    return { machine: m, next, remaining, state };
  }).filter(a=> a.state !== "ok").sort((a,b)=> a.remaining - b.remaining);

  const approaching = alerts.filter(a=>a.state==="approaching");
  const overdue = alerts.filter(a=>a.state==="overdue");

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Maintenance</h1><p className="text-sm text-muted-foreground">Hour-based & date-based service • {machines.length} machines • {records.length} records shown</p></div>

      {(overdue.length>0 || approaching.length>0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {overdue.length>0 && <Card className="border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"><CardHeader><CardTitle className="text-red-800">Overdue ({overdue.length})</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{overdue.map(a=> <div key={a.machine.id} className="flex justify-between"><span>{a.machine.name} • {a.machine.registrationNumber}</span><span className="font-mono font-bold text-red-700">Overdue by {Math.abs(a.remaining).toFixed(0)} h</span></div>)}</CardContent></Card>}
          {approaching.length>0 && <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10"><CardHeader><CardTitle className="text-amber-800">Approaching ({approaching.length})</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{approaching.map(a=> <div key={a.machine.id} className="flex justify-between"><span>{a.machine.name}</span><span className="font-mono">{a.remaining.toFixed(0)} h left → {a.next.toFixed(1)} h</span></div>)}</CardContent></Card>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Service Schedule (per Machine)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {machines.map(m=>{
                const next = (m.lastServiceMeter ?? 0) + (m.serviceIntervalHours ?? 500);
                const remaining = next - m.currentHourMeter;
                const pct = Math.min(100, Math.max(5, ((m.currentHourMeter - (m.lastServiceMeter ?? 0)) / (m.serviceIntervalHours ?? 500))*100));
                let state: "ok"|"approaching"|"overdue" = "ok";
                if (remaining <=0) state="overdue"; else if (remaining<=100) state="approaching";
                return (
                  <div key={m.id} className="rounded-xl border p-3">
                    <div className="flex justify-between text-sm"><span className="font-semibold">{m.name}</span><span className="font-mono text-xs">{m.currentHourMeter.toFixed(1)} h</span></div>
                    <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden"><div className={`h-full ${state==="overdue"?"bg-red-500":state==="approaching"?"bg-amber-500":"bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div>
                    <div className="flex justify-between text-xs mt-1"><span>Last {m.lastServiceMeter ? `${m.lastServiceMeter} h` : "—"}</span><span>Next {next.toFixed(1)} h • {remaining>0?`${remaining.toFixed(0)} h left`:`overdue`}</span></div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader><CardTitle>Recent Service History</CardTitle></CardHeader>
            <CardContent>
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Machine</TableHead><TableHead>Type</TableHead><TableHead>Meter</TableHead><TableHead>Cost</TableHead><TableHead>Next</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {records.map(r=>(
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{new Date(r.serviceDate).toLocaleDateString()}</TableCell>
                        <TableCell><span className="font-semibold">{r.machine.name}</span><div className="text-xs font-mono">{r.machine.registrationNumber}</div></TableCell>
                        <TableCell className="text-xs">{r.serviceType}</TableCell>
                        <TableCell className="font-mono text-xs">{r.meterReading ?? "—"}</TableCell>
                        <TableCell className="text-xs">₹{r.totalCost ?? 0}</TableCell>
                        <TableCell className="font-mono text-xs">{r.nextServiceHours ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {records.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No maintenance records yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-2 md:hidden">
                {records.map(r=> <div key={r.id} className="rounded-lg border p-3 text-sm"><p className="font-semibold">{r.machine.name} • {new Date(r.serviceDate).toLocaleDateString()}</p><p className="text-xs text-muted-foreground">{r.serviceType} • {r.meterReading} h • ₹{r.totalCost}</p></div>)}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card><CardHeader><CardTitle>Add Maintenance Record</CardTitle></CardHeader><CardContent><MaintenanceForm machines={machines} /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}