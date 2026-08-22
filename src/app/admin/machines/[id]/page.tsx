import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Fuel, Wrench, Clock3, MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { archiveMachine } from "@/lib/actions/machines";

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.machine.findUnique({ where: { id } });
  if (!m) notFound();

  const assignments = await prisma.assignment.findMany({ where: { machineId: id, status: "ACTIVE" }, include: { jobSite: true }, take: 5 });
  const recentSessions = await prisma.workSession.findMany({ where: { machineId: id }, orderBy: { createdAt: "desc" }, take: 5 });
  const fuelTotal = await prisma.fuelLog.aggregate({ where: { machineId: id }, _sum: { litres: true } });
  const maintenanceCount = await prisma.maintenanceRecord.count({ where: { machineId: id } });
  const [fuelCostAgg, expenseAgg, maintCostAgg, revenueAgg] = await Promise.all([
    prisma.fuelLog.aggregate({ where: { machineId: id }, _sum: { totalCost: true } }),
    prisma.expense.aggregate({ where: { machineId: id }, _sum: { amount: true } }),
    prisma.maintenanceRecord.aggregate({ where: { machineId: id }, _sum: { totalCost: true } }),
    prisma.revenue.aggregate({ where: { machineId: id }, _sum: { amount: true } }),
  ]);
  const fuelCost = fuelCostAgg._sum.totalCost ?? 0;
  const expenseCost = expenseAgg._sum.amount ?? 0;
  const maintCost = maintCostAgg._sum.totalCost ?? 0;
  const revenueTotal = revenueAgg._sum.amount ?? 0;
  const profit = revenueTotal - (fuelCost + expenseCost + maintCost);

  const nextService = m.serviceIntervalHours ? (m.lastServiceMeter ?? 0) + (m.serviceIntervalHours ?? 500) : null;
  const remaining = nextService !== null ? nextService - m.currentHourMeter : null;
  let serviceState: "ok" | "approaching" | "overdue" = "ok";
  if (remaining !== null) {
    if (remaining <= 0) serviceState = "overdue";
    else if (remaining <= 100) serviceState = "approaching";
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link href="/admin/machines"><ArrowLeft className="h-4 w-4" /> Back to Machinery</Link></Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{m.name} — {m.registrationNumber}</h1>
            <StatusBadge status={m.status} />
          </div>
          <p className="text-sm text-muted-foreground">{m.manufacturer} {m.model} {m.manufacturingYear ? `• ${m.manufacturingYear}` : ""} • {m.machineType}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href={`/admin/machines/${m.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
          <form action={async ()=>{"use server"; await archiveMachine(m.id)}}>
            <Button variant="outline" type="submit" className="text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Retire</Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Hour Meter</span><span className="font-mono font-bold">{m.currentHourMeter.toFixed(1)} h</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Expected Fuel</span><span className="font-mono">{m.expectedFuelEfficiency ? `${m.expectedFuelEfficiency} L/hr` : "—"}</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Service Interval</span><span>{m.serviceIntervalHours} h</span></div>
              <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Purchase Price</span><span className="font-mono">{m.purchasePrice ? `₹${Number(m.purchasePrice).toLocaleString("en-IN")}` : "—"}</span></div>
              <div className="flex justify-between py-2"><span className="text-muted-foreground">Status</span><StatusBadge status={m.status} /></div>
              {m.notes && <div className="rounded-lg bg-muted p-3 text-xs"><span className="font-semibold">Notes:</span> {m.notes}</div>}
            </div>
            <div className="rounded-xl bg-muted p-4 flex flex-col justify-center text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Photo</p>
              <div className="mt-3 h-40 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground bg-card">Machine image placeholder</div>
              <p className="text-xs text-muted-foreground mt-2">Storage for receipts/meter photos arrives Phase 6</p>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Current Assignment</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
            {assignments.length===0 ? <p className="text-muted-foreground">No active assignment</p> : assignments.map(a=>(
              <div key={a.id} className="rounded-lg border p-3"><p className="font-semibold">{a.jobSite.name}</p><p className="text-xs text-muted-foreground">{a.jobSite.address ?? "—"} • Since {new Date(a.assignedAt).toLocaleDateString()}</p></div>
            ))}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Fuel</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Total Fuel Logged</span><span className="font-mono font-bold">{fuelTotal._sum.litres ? `${fuelTotal._sum.litres.toFixed(1)} L` : "—"}</span></div>
            <div className="flex justify-between"><span>Expected</span><span className="font-mono">{m.expectedFuelEfficiency ? `${m.expectedFuelEfficiency} L/hr` : "—"}</span></div>
          </CardContent></Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Maintenance</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span>Last Service Meter</span><span className="font-mono">{m.lastServiceMeter ? `${m.lastServiceMeter} h` : "—"}</span></div>
          <div className="flex justify-between"><span>Next Service</span><span className="font-semibold">{nextService ? `${nextService.toFixed(1)} h` : "—"} {remaining!==null ? `(${remaining>0?`in ${remaining.toFixed(0)} h`:`overdue by ${Math.abs(remaining).toFixed(0)} h`})` : ""}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full ${serviceState==="overdue"?"bg-red-500":serviceState==="approaching"?"bg-amber-500":"bg-emerald-500"}`} style={{ width: `${remaining!==null ? Math.max(5, Math.min(100, ((m.currentHourMeter - (m.lastServiceMeter??0)) / (m.serviceIntervalHours??500))*100)) : 30}%` }} /></div>
          <div className={`rounded-lg p-2 text-xs border ${serviceState==="overdue"?"bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-300":serviceState==="approaching"?"bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-amber-300":"bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-300"}`}>
            {serviceState==="overdue"?"🔴 Service overdue":serviceState==="approaching"?"🟡 Service approaching": "🟢 Service OK"} • {maintenanceCount} records
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild><Link href="/admin/maintenance"><Wrench className="h-4 w-4" /> View history</Link></Button>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Financial (Admin)</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Fuel Cost</span><span className="font-mono">₹{fuelCost.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span>Maintenance ({maintenanceCount})</span><span className="font-mono">₹{maintCost.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span>Other Expenses</span><span className="font-mono">₹{expenseCost.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span>Revenue</span><span className="font-mono">₹{revenueTotal.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between border-t pt-2 font-bold"><span>Est. Profit</span><span className={profit>=0?"text-emerald-600":"text-red-600"}>₹{profit.toLocaleString("en-IN")}</span></div>
          <p className="text-xs text-muted-foreground">Revenue - Fuel - Maintenance - Expenses • Estimated</p>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        {recentSessions.length===0 ? <p className="text-muted-foreground">No work sessions yet</p> : recentSessions.map(s=>(
          <div key={s.id} className="flex gap-3 border-b py-2 last:border-0"><Clock3 className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><p><span className="font-mono">{new Date(s.startTime).toLocaleDateString()}</span> • {s.openingHourMeter.toFixed(1)} → {s.closingHourMeter ? `${s.closingHourMeter.toFixed(1)} h` : "active"} {s.workingHours ? `(${s.workingHours.toFixed(1)} h)` : ""}</p><p className="text-xs text-muted-foreground">{s.notes ?? "—"}</p></div></div>
        ))}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Activity Timeline (placeholder)</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        <div className="flex gap-3"><Clock3 className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><p><span className="font-mono">08:12</span> — Work started • Opening 3,421.4 h</p></div></div>
        <div className="flex gap-3"><Fuel className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><p><span className="font-mono">11:22</span> — 35 L diesel added</p></div></div>
        <div className="flex gap-3"><MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><p><span className="font-mono">13:05</span> — Hydraulic leak reported</p></div></div>
      </CardContent></Card>
    </div>
  );
}