import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock } from "lucide-react";
import { AssignmentForm } from "@/components/projects/assignment-form";
import { endAssignment } from "@/lib/actions/assignments";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.jobSite.findUnique({ where: { id } });
  if (!site) notFound();

  const assignmentsActive = await prisma.assignment.findMany({ where: { jobSiteId: id, status: "ACTIVE" }, include: { machine: true }, orderBy: { assignedAt: "desc" } });
  const assignmentsHistory = await prisma.assignment.findMany({ where: { jobSiteId: id, status: "COMPLETED" }, include: { machine: true }, orderBy: { endedAt: "desc" }, take: 20 });
  const operatorIds = [...new Set([...assignmentsActive, ...assignmentsHistory].map(a=>a.operatorId))];
  const users = await prisma.user.findMany({ where: { id: { in: operatorIds } }, select: { id: true, name: true, phone: true } });
  const userMap = new Map(users.map(u=>[u.id, u]));

  const machines = await prisma.machine.findMany({ where: { status: { not: "RETIRED" } }, select: { id: true, name: true, registrationNumber: true }, orderBy: { name: "asc" } });
  const operators = await prisma.user.findMany({ where: { role: "OPERATOR", status: "ACTIVE" }, select: { id: true, name: true, phone: true }, orderBy: { name: "asc" } });

  const workSessions = await prisma.workSession.findMany({ where: { jobSiteId: id }, orderBy: { createdAt: "desc" }, take: 5, include: { machine: true } });
  const totalHours = workSessions.reduce((sum, s)=> sum + (s.workingHours ?? 0), 0);
  const [revAgg, expAgg, fuelAgg] = await Promise.all([
    prisma.revenue.aggregate({ where: { jobSiteId: id }, _sum: { amount: true, amountReceived: true } }),
    prisma.expense.aggregate({ where: { jobSiteId: id }, _sum: { amount: true } }),
    prisma.fuelLog.aggregate({ where: { jobSiteId: id }, _sum: { totalCost: true, litres: true } }),
  ]);
  const projectRevenue = revAgg._sum.amount ?? 0;
  const projectReceived = revAgg._sum.amountReceived ?? 0;
  const projectExpenses = expAgg._sum.amount ?? 0;
  const projectFuelCost = fuelAgg._sum.totalCost ?? 0;
  const projectFuelLitres = fuelAgg._sum.litres ?? 0;
  const projectProfit = projectRevenue - (projectExpenses + projectFuelCost);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link href="/admin/projects"><ArrowLeft className="h-4 w-4" /> Back to Projects</Link></Button>
      <div className="flex flex-wrap justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">{site.name}</h1><p className="text-sm text-muted-foreground">{site.address ?? "—"} {site.latitude ? `• ${site.latitude},${site.longitude}`:""}</p></div>
        <div className="flex gap-2"><StatusBadge status={site.status} /><Button variant="outline" asChild><Link href={`/admin/projects/${site.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button></div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Billing</p><p className="text-lg font-bold">{site.billingType} {site.rate ? `• ₹${Number(site.rate).toLocaleString("en-IN")}` : ""}</p><p className="text-xs text-muted-foreground">{site.billingType==="HOURLY"?"per hour":site.billingType==="DAILY"?"per day":site.billingType}</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Client</p><p className="font-semibold">{site.clientName ?? "—"}</p><p className="text-xs text-muted-foreground font-mono">{site.clientPhone ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Active Machines</p><p className="text-2xl font-bold">{assignmentsActive.length}</p><p className="text-xs text-muted-foreground">{totalHours.toFixed(1)} h recent</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Project Info</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Start</span><span>{site.startDate ? new Date(site.startDate).toLocaleDateString() : "—"}</span></div>
            <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Expected End</span><span>{site.expectedEndDate ? new Date(site.expectedEndDate).toLocaleDateString() : "—"}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Status</span><StatusBadge status={site.status} /></div>
          </div>
          <div className="rounded-xl bg-muted p-4 text-sm">{site.notes ?? "No notes"}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Active Assignments</span><span className="font-bold">{assignmentsActive.length}</span></div>
          <div className="flex justify-between"><span>History</span><span>{assignmentsHistory.length}</span></div>
          <div className="flex justify-between"><span>Recent Hours</span><span className="font-mono">{totalHours.toFixed(1)} h</span></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Financial (Est.)</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Revenue</span><span className="font-mono">₹{projectRevenue.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span>Received</span><span className="font-mono text-emerald-700">₹{projectReceived.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span>Expenses</span><span className="font-mono">₹{projectExpenses.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between"><span>Fuel Cost</span><span className="font-mono">₹{projectFuelCost.toLocaleString("en-IN")} ({projectFuelLitres.toFixed(1)} L)</span></div>
          <div className="flex justify-between border-t pt-2 font-bold"><span>Est. Profit</span><span className={projectProfit>=0?"text-emerald-600":"text-red-600"}>₹{projectProfit.toLocaleString("en-IN")}</span></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Assign Machine + Operator</CardTitle></CardHeader>
        <CardContent><AssignmentForm machines={machines} operators={operators} jobSiteId={site.id} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active Assignments</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {assignmentsActive.length===0 ? <p className="text-sm text-muted-foreground">No active assignments</p> : assignmentsActive.map(a=>{
            const u = userMap.get(a.operatorId);
            return (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                <div>
                  <p className="font-semibold">{a.machine.name} • {a.machine.registrationNumber} <span className="text-xs text-muted-foreground">({a.machine.machineType})</span></p>
                  <p className="text-sm text-muted-foreground">{u ? `${u.name} • ${u.phone}` : a.operatorId} • since {new Date(a.assignedAt).toLocaleDateString()}</p>
                </div>
                <form action={async ()=>{ "use server"; await endAssignment(a.id); }}>
                  <Button variant="outline" size="sm" type="submit">End Assignment</Button>
                </form>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {assignmentsHistory.length>0 && (
        <Card><CardHeader><CardTitle>Assignment History</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          {assignmentsHistory.map(a=>{
            const u = userMap.get(a.operatorId);
            return (
              <div key={a.id} className="flex justify-between border-b py-2 last:border-0">
                <span>{a.machine.name} • {u?.name ?? a.operatorId} • {new Date(a.assignedAt).toLocaleDateString()} → {a.endedAt ? new Date(a.endedAt).toLocaleDateString() : "—"}</span>
                <span className="text-muted-foreground">COMPLETED</span>
              </div>
            );
          })}
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Recent Work Sessions @ Site</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        {workSessions.length===0 ? <p className="text-muted-foreground">No sessions yet</p> : workSessions.map(s=>(
          <div key={s.id} className="flex gap-3 border-b py-2 last:border-0"><Clock className="h-4 w-4 mt-0.5 text-muted-foreground" /><div><p>{new Date(s.startTime).toLocaleDateString()} • {s.machine.name} • {s.openingHourMeter.toFixed(1)} → {s.closingHourMeter ? `${s.closingHourMeter.toFixed(1)} h` : "active"}</p></div></div>
        ))}
      </CardContent></Card>
    </div>
  );
}
