import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WeeklyHoursChart } from "@/components/dashboard/weekly-hours-chart";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin();
  const machines = await prisma.machine.findMany({ orderBy: { name: "asc" } });
  const sites = await prisma.jobSite.findMany();

  // Date range: last 30 days
  const since = new Date(); since.setDate(since.getDate()-30); since.setHours(0,0,0,0);
  const availableHours = 30 * 8; // 8h per day

  const machineStats = await Promise.all(machines.map(async m=>{
    const [workAgg, fuelAgg, maintAgg, expAgg, revAgg] = await Promise.all([
      prisma.workSession.aggregate({ where: { machineId: m.id, status: "COMPLETED", startTime: { gte: since } }, _sum: { workingHours: true } }),
      prisma.fuelLog.aggregate({ where: { machineId: m.id, date: { gte: since } }, _sum: { litres: true, totalCost: true } }),
      prisma.maintenanceRecord.aggregate({ where: { machineId: m.id }, _sum: { totalCost: true } }),
      prisma.expense.aggregate({ where: { machineId: m.id }, _sum: { amount: true } }),
      prisma.revenue.aggregate({ where: { machineId: m.id }, _sum: { amount: true } }),
    ]);
    const hours = workAgg._sum.workingHours ?? 0;
    const litres = fuelAgg._sum.litres ?? 0;
    const fuelCost = fuelAgg._sum.totalCost ?? 0;
    const maintCost = maintAgg._sum.totalCost ?? 0;
    const expCost = expAgg._sum.amount ?? 0;
    const revenue = revAgg._sum.amount ?? 0;
    const utilization = availableHours ? (hours / availableHours * 100) : 0;
    const fuelEff = hours>0 ? litres / hours : null;
    const costPerHour = hours>0 ? (fuelCost + maintCost + expCost) / hours : null;
    const maintPerHour = hours>0 ? maintCost / hours : null;
    const profit = revenue - (fuelCost + maintCost + expCost);
    let fuelStatus: "ok"|"warning"|"danger" = "ok";
    let fuelDiff: number | null = null;
    if (fuelEff !== null && m.expectedFuelEfficiency) {
      fuelDiff = ((fuelEff - m.expectedFuelEfficiency)/m.expectedFuelEfficiency)*100;
      if (fuelDiff > 30) fuelStatus="danger"; else if (fuelDiff>10) fuelStatus="warning";
    }
    return { machine: m, hours, litres, fuelCost, maintCost, expCost, revenue, utilization, fuelEff, costPerHour, maintPerHour, profit, fuelStatus, fuelDiff };
  }));

  const projectStats = await Promise.all(sites.map(async s=>{
    const [workAgg, fuelAgg, expAgg, revAgg] = await Promise.all([
      prisma.workSession.aggregate({ where: { jobSiteId: s.id, status: "COMPLETED" }, _sum: { workingHours: true } }),
      prisma.fuelLog.aggregate({ where: { jobSiteId: s.id }, _sum: { litres: true, totalCost: true } }),
      prisma.expense.aggregate({ where: { jobSiteId: s.id }, _sum: { amount: true } }),
      prisma.revenue.aggregate({ where: { jobSiteId: s.id }, _sum: { amount: true, amountReceived: true } }),
    ]);
    const hours = workAgg._sum.workingHours ?? 0;
    const litres = fuelAgg._sum.litres ?? 0;
    const fuelCost = fuelAgg._sum.totalCost ?? 0;
    const expCost = expAgg._sum.amount ?? 0;
    const revenue = revAgg._sum.amount ?? 0;
    const received = revAgg._sum.amountReceived ?? 0;
    const profit = revenue - (expCost + fuelCost);
    const costPerHour = hours>0 ? (expCost+fuelCost)/hours : null;
    return { site: s, hours, litres, fuelCost, expCost, revenue, received, profit, costPerHour };
  }));

  // Weekly trend last 7 days (overall)
  const days: { day: string; date: Date }[] = [];
  for(let i=6;i>=0;i--){ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i); days.push({ day: d.toLocaleDateString("en-US",{weekday:"short"}), date: d }); }
  const weekly = await Promise.all(days.map(async({day,date})=>{
    const next=new Date(date); next.setDate(date.getDate()+1);
    const agg=await prisma.workSession.aggregate({ where:{ startTime:{gte:date, lt:next}, status:"COMPLETED"}, _sum:{workingHours:true} });
    return { day, hours: Number((agg._sum.workingHours ?? 0).toFixed(1)) };
  }));

  const anomalies = machineStats.filter(m=>m.fuelStatus==="danger" || m.utilization<10 || (m.costPerHour!==null && m.costPerHour>2000));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Analytics</h1><p className="text-sm text-muted-foreground">Utilization, fuel, cost/hour, profitability — last 30 days • Estimated where noted</p></div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Avg Utilization</p><p className="text-2xl font-bold">{(machineStats.reduce((s,m)=>s+m.utilization,0)/Math.max(1,machineStats.length)).toFixed(1)}%</p><p className="text-xs text-muted-foreground">{availableHours}h available (8h×30d)</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Total Hours (30d)</p><p className="text-2xl font-bold">{machineStats.reduce((s,m)=>s+m.hours,0).toFixed(1)} h</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Anomalies</p><p className="text-2xl font-bold text-amber-600">{anomalies.length}</p><p className="text-xs text-muted-foreground">High fuel / low use / high cost</p></CardContent></Card>
      </div>

      {anomalies.length>0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10"><CardHeader><CardTitle className="text-amber-800">Anomalies — Attention</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          {anomalies.map(a=>(
            <div key={a.machine.id} className="flex justify-between">
              <span className="font-semibold">{a.machine.name} • {a.machine.registrationNumber}</span>
              <span className="text-xs">
                {a.fuelStatus==="danger" && `Fuel +${a.fuelDiff?.toFixed(0)}% `}
                {a.utilization<10 && `Util ${a.utilization.toFixed(1)}% `}
                {a.costPerHour!==null && a.costPerHour>2000 && `Cost ₹${a.costPerHour.toFixed(0)}/h`}
              </span>
            </div>
          ))}
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle>Machine Utilization & Profitability (30d)</CardTitle></CardHeader><CardContent>
        <div className="hidden md:block">
          <Table>
            <TableHeader><TableRow><TableHead>Machine</TableHead><TableHead>Hours</TableHead><TableHead>Util %</TableHead><TableHead>Fuel L/hr</TableHead><TableHead>Cost/hr</TableHead><TableHead>Maint/hr</TableHead><TableHead>Profit (est.)</TableHead></TableRow></TableHeader>
            <TableBody>
              {machineStats.sort((a,b)=> b.profit - a.profit).map(s=>(
                <TableRow key={s.machine.id} className={s.fuelStatus==="danger"?"bg-red-50 dark:bg-red-500/10":""}>
                  <TableCell><span className="font-semibold">{s.machine.name}</span><div className="text-xs font-mono">{s.machine.registrationNumber}</div></TableCell>
                  <TableCell className="font-mono">{s.hours.toFixed(1)}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.utilization<10?"bg-red-100 text-red-800":s.utilization<30?"bg-amber-100 text-amber-800":"bg-emerald-100 text-emerald-800"}`}>{s.utilization.toFixed(1)}%</span></TableCell>
                  <TableCell className="font-mono text-xs">{s.fuelEff!==null?`${s.fuelEff.toFixed(2)}`:`—`} {s.fuelDiff!==null && <span className={s.fuelStatus==="danger"?"text-red-600":s.fuelStatus==="warning"?"text-amber-600":"text-muted-foreground"}>({s.fuelDiff>0?`+${s.fuelDiff.toFixed(0)}%`: `${s.fuelDiff.toFixed(0)}%`})</span>}<div className="text-xs text-muted-foreground">exp {s.machine.expectedFuelEfficiency ?? "—"}</div></TableCell>
                  <TableCell className="font-mono text-xs">{s.costPerHour!==null?`₹${s.costPerHour.toFixed(0)}`:"—"}</TableCell>
                  <TableCell className="font-mono text-xs">{s.maintPerHour!==null?`₹${s.maintPerHour.toFixed(0)}`:"—"}</TableCell>
                  <TableCell className={`font-mono font-bold ${s.profit>=0?"text-emerald-700":"text-red-700"}`}>₹{s.profit.toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-2 md:hidden">
          {machineStats.map(s=>(
            <div key={s.machine.id} className="rounded-xl border p-3">
              <div className="flex justify-between"><span className="font-semibold">{s.machine.name}</span><span className="text-xs">{s.utilization.toFixed(1)}% util</span></div>
              <div className="text-xs font-mono">{s.machine.registrationNumber} • {s.hours.toFixed(1)} h • {s.fuelEff?.toFixed(2) ?? "—"} L/hr</div>
              <div className="text-xs">Profit: <span className={s.profit>=0?"text-emerald-700":"text-red-700"}>₹{s.profit.toLocaleString("en-IN")}</span></div>
            </div>
          ))}
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Project Profitability</CardTitle></CardHeader><CardContent>
        <div className="hidden md:block">
          <Table>
            <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Hours</TableHead><TableHead>Fuel</TableHead><TableHead>Expenses</TableHead><TableHead>Revenue</TableHead><TableHead>Profit</TableHead><TableHead>Cost/hr</TableHead></TableRow></TableHeader>
            <TableBody>
              {projectStats.sort((a,b)=> b.profit - a.profit).map(s=>(
                <TableRow key={s.site.id}>
                  <TableCell><span className="font-semibold">{s.site.name}</span><div className="text-xs text-muted-foreground">{s.site.clientName ?? "—"}</div></TableCell>
                  <TableCell className="font-mono">{s.hours.toFixed(1)}</TableCell>
                  <TableCell className="text-xs">{s.litres.toFixed(1)} L • ₹{s.fuelCost.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="font-mono">₹{s.expCost.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="font-mono">₹{s.revenue.toLocaleString("en-IN")} <span className="text-xs text-muted-foreground">(₹{s.received.toLocaleString("en-IN")} rec)</span></TableCell>
                  <TableCell className={`font-mono font-bold ${s.profit>=0?"text-emerald-700":"text-red-700"}`}>₹{s.profit.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="font-mono text-xs">{s.costPerHour!==null?`₹${s.costPerHour.toFixed(0)}`:"—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-2 md:hidden">
          {projectStats.map(s=>(
            <div key={s.site.id} className="rounded-xl border p-3"><p className="font-semibold">{s.site.name}</p><p className="text-xs">Hours {s.hours.toFixed(1)} • Profit <span className={s.profit>=0?"text-emerald-700":"text-red-700"}>₹{s.profit.toLocaleString("en-IN")}</span></p></div>
          ))}
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Usage Trend — Last 7 Days (Hours)</CardTitle></CardHeader><CardContent><WeeklyHoursChart data={weekly} /></CardContent></Card>
    </div>
  );
}