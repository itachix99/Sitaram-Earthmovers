import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Truck, Users, MapPinned, Fuel, AlertTriangle, Clock3, IndianRupee } from "lucide-react";
import Link from "next/link";
import { WeeklyHoursChart } from "@/components/dashboard/weekly-hours-chart";
import { requireAdmin } from "@/lib/auth-guards";
import { toNum } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAdmin();
  const [totalMachines, machines, sites, operators, fuelTodayAgg, breakdownsOpen, workTodayAgg] = await Promise.all([
    prisma.machine.count(),
    prisma.machine.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.jobSite.count({ where: { status: "ACTIVE" } }),
    prisma.operator.count({ where: { status: "ACTIVE" } }),
    prisma.fuelLog.aggregate({
      where: { date: { gte: new Date(new Date().setHours(0,0,0,0)) } },
      _sum: { litres: true, totalCost: true },
    }),
    prisma.breakdownReport.count({ where: { status: "OPEN" } }),
    prisma.workSession.aggregate({
      where: { startTime: { gte: new Date(new Date().setHours(0,0,0,0)) }, status: "COMPLETED" },
      _sum: { workingHours: true },
    }),
  ]);

  const statusCounts = await prisma.machine.groupBy({ by: ["status"], _count: { status: true } });
  const statusMap = new Map(statusCounts.map(s=>[s.status, s._count.status]));
  const working = statusMap.get("WORKING") ?? 0;
  const idle = statusMap.get("IDLE") ?? 0;
  const active = statusMap.get("ACTIVE") ?? 0;

  // Maintenance approaching/overdue
  const allMachines = await prisma.machine.findMany({ select: { currentHourMeter: true, lastServiceMeter: true, serviceIntervalHours: true } });
  let approaching = 0, overdue = 0;
  for (const m of allMachines) {
    const next = toNum(m.lastServiceMeter) + (m.serviceIntervalHours ?? 500);
    const remaining = next - toNum(m.currentHourMeter);
    if (remaining <= 0) overdue++;
    else if (remaining <= 100) approaching++;
  }

  const todayHours = toNum(workTodayAgg._sum.workingHours);
  const fuelLitres = toNum(fuelTodayAgg._sum.litres);
  const fuelCost = toNum(fuelTodayAgg._sum.totalCost);

  // Weekly hours last 7 days
  const days: { day: string; date: Date }[] = [];
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i);
    days.push({ day: d.toLocaleDateString("en-US", { weekday: "short" }), date: d });
  }
  const weeklyData = await Promise.all(days.map(async ({day, date})=>{
    const next = new Date(date); next.setDate(date.getDate()+1);
    const agg = await prisma.workSession.aggregate({ where: { startTime: { gte: date, lt: next }, status: "COMPLETED" }, _sum: { workingHours: true } });
    return { day, hours: Number((agg._sum.workingHours ?? 0).toFixed(1)) };
  }));

  // Recent activity: mix work sessions, fuel, breakdowns
  const [recentSessions, recentFuel, recentBreakdowns] = await Promise.all([
    prisma.workSession.findMany({ include: { machine: true, operator: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.fuelLog.findMany({ include: { machine: true }, orderBy: { createdAt: "desc" }, take: 2 }),
    prisma.breakdownReport.findMany({ include: { machine: true, operator: true }, orderBy: { reportedAt: "desc" }, take: 2 }),
  ]);

  // Revenue today: derived from actual site rates (fallback 1800 only when no rate)
  const siteRates = await prisma.jobSite.findMany({ select: { id: true, rate: true } });
  const rateMap = new Map(siteRates.map(s => [s.id, Number(s.rate ?? 1800)]));
  const todaySessionsForRevenue = await prisma.workSession.findMany({ where: { startTime: { gte: new Date(new Date().setHours(0,0,0,0)) }, status: "COMPLETED" }, select: { workingHours: true, jobSiteId: true } });
  let estRevenue = 0;
  let usedFallback = false;
  for (const s of todaySessionsForRevenue) {
    const r = s.jobSiteId ? rateMap.get(s.jobSiteId) : undefined;
    if (r === undefined) usedFallback = true;
    estRevenue += Number(s.workingHours ?? 0) * (r ?? 1800);
  }
  const avgRate = todaySessionsForRevenue.length ? Math.round(estRevenue / Math.max(0.1, todayHours)) : 1800;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Dashboard</h1><p className="text-sm text-muted-foreground">Good morning — live from Sitaram fleet • {new Date().toLocaleDateString("en-IN")}</p></div>
        <div className="flex gap-2"><Button variant="outline" asChild><Link href="/admin/reports">Export Report</Link></Button><Button asChild><Link href="/admin/machines">Add Machine</Link></Button></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Machines" value={totalMachines} sub={`${active} active • ${working} working`} icon={Truck} />
        <StatCard label="Working Now" value={working} sub={`${totalMachines?Math.round(working/totalMachines*100):0}% utilization • ${idle} idle`} icon={Clock3} variant="yellow" />
        <StatCard label="Fuel Today" value={`${fuelLitres.toFixed(0)} L`} sub={`₹${fuelCost.toLocaleString("en-IN")} • ${todayHours? (fuelLitres/todayHours).toFixed(1):"—"} L/hr`} icon={Fuel} />
        <StatCard label="Revenue (Today)" value={`₹${(estRevenue/1000).toFixed(1)}k`} sub={`${usedFallback ? "~" : ""}₹${avgRate}/hr avg • ${todayHours.toFixed(1)}h • from site rates`} icon={IndianRupee} variant="charcoal" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active Sites" value={sites} sub={`${sites} sites • ${working} machines deployed`} icon={MapPinned} />
        <StatCard label="Operators Active" value={`${operators}`} sub={`${operators} active`} icon={Users} />
        <StatCard label="Open Issues" value={breakdownsOpen} sub={`${approaching} approaching • ${overdue} overdue maintenance`} icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Fleet Status — Live</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/admin/machines">View all</Link></Button></CardHeader>
          <CardContent className="space-y-3">
            {machines.map((m)=>(
              <div key={m.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/50">
                <div className="min-w-0"><p className="font-semibold leading-none">{m.name}</p><p className="text-xs text-muted-foreground font-mono">{m.registrationNumber} • {m.currentHourMeter.toFixed(1)} h</p></div>
                <StatusBadge status={m.status} />
              </div>
            ))}
            {machines.length===0 && <p className="text-sm text-muted-foreground">No machines</p>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Maintenance Due</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {overdue>0 && <div className="flex justify-between items-center rounded-lg border border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10 dark:bg-red-500/10 dark:border-red-500/25 p-3"><div><p className="text-sm font-semibold">Overdue</p><p className="text-xs text-muted-foreground">{overdue} machines</p></div><span className="h-2 w-2 rounded-full bg-red-500" /></div>}
              {approaching>0 && <div className="flex justify-between items-center rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10 dark:bg-amber-500/10 dark:border-amber-500/25 p-3"><div><p className="text-sm font-semibold">Approaching</p><p className="text-xs text-muted-foreground">{approaching} machines within 100h</p></div><span className="h-2 w-2 rounded-full bg-amber-500" /></div>}
              {overdue===0 && approaching===0 && <p className="text-sm text-muted-foreground">All machines OK</p>}
              <Button variant="outline" size="sm" className="w-full" asChild><Link href="/admin/maintenance">View schedule</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentSessions.map(s=> (
                <div key={s.id} className="flex gap-3"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2" /><div><p><span className="font-semibold">{s.operator.name}</span> completed {s.machine.name} • {s.workingHours ? toNum(s.workingHours).toFixed(1) : "—"} h</p><p className="text-xs text-muted-foreground">{toNum(s.openingHourMeter).toFixed(1)} → {s.closingHourMeter ? toNum(s.closingHourMeter).toFixed(1) : "—"} h</p></div></div>
              ))}
              {recentFuel.map(f=> (
                <div key={f.id} className="flex gap-3"><div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2" /><div><p>{toNum(f.litres)} L diesel added — {f.machine.name}</p><p className="text-xs text-muted-foreground">₹{f.totalCost ? toNum(f.totalCost).toLocaleString("en-IN") : "—"} • {f.fuelStation ?? "—"}</p></div></div>
              ))}
              {recentBreakdowns.map(b=> (
                <div key={b.id} className="flex gap-3"><div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2" /><div><p>Breakdown: {b.issue} — {b.machine.name}</p><p className="text-xs text-muted-foreground">Reported by {b.operator.name} • {b.severity}</p></div></div>
              ))}
              {recentSessions.length===0 && recentFuel.length===0 && recentBreakdowns.length===0 && <p className="text-muted-foreground">No recent activity</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Operating Hours — Last 7 Days</CardTitle><span className="text-xs text-muted-foreground">Recharts • real WorkSession sum</span></CardHeader>
        <CardContent><WeeklyHoursChart data={weeklyData} /></CardContent>
      </Card>
    </div>
  );
}