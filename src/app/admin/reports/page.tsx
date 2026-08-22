import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "./export-buttons";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

const REPORTS = [
  { id: "fuel", label: "Fuel" },
  { id: "maintenance", label: "Maintenance" },
  { id: "expense", label: "Expense" },
  { id: "operator", label: "Operator" },
  { id: "project", label: "Project" },
  { id: "machine-daily", label: "Machine Daily" },
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ type?: string; machineId?: string; operatorId?: string; projectId?: string; start?: string; end?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const type = params.type ?? "fuel";
  const { machineId, operatorId, projectId, start, end } = params;
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (endDate) endDate.setHours(23,59,59,999);

  const [machines, operators, sites] = await Promise.all([
    prisma.machine.findMany({ select: { id: true, name: true, registrationNumber: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "OPERATOR" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.jobSite.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const exportParams = new URLSearchParams();
  if (type) exportParams.set("type", type);
  if (machineId) exportParams.set("machineId", machineId);
  if (operatorId) exportParams.set("operatorId", operatorId);
  if (projectId) exportParams.set("projectId", projectId);
  if (start) exportParams.set("start", start);
  if (end) exportParams.set("end", end);
  const base = exportParams.toString();

  let content: React.ReactNode = null;

  if (type === "fuel") {
    const where: Record<string, unknown> = {};
    if (machineId) (where as Record<string,unknown>).machineId = machineId;
    if (startDate || endDate) (where as Record<string,unknown>).date = { ...(startDate?{gte:startDate}:{}), ...(endDate?{lte:endDate}:{}) };
    const logs = await prisma.fuelLog.findMany({ where: where as never, include: { machine: true, operator: true, jobSite: true }, orderBy: { date: "desc" }, take: 100 });
    content = (
      <Card><CardHeader><CardTitle>Fuel Report {logs.length} rows</CardTitle></CardHeader><CardContent>
        <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Machine</TableHead><TableHead>Operator</TableHead><TableHead>Litres</TableHead><TableHead>Cost</TableHead><TableHead>Station</TableHead></TableRow></TableHeader><TableBody>{logs.map(l=> <TableRow key={l.id}><TableCell className="text-xs">{new Date(l.date).toLocaleDateString()}</TableCell><TableCell><span className="font-semibold">{l.machine.name}</span><div className="text-xs font-mono">{l.machine.registrationNumber}</div></TableCell><TableCell className="text-xs">{l.operator.name}</TableCell><TableCell className="font-mono font-bold">{l.litres} L</TableCell><TableCell className="text-xs">₹{l.totalCost ?? "—"}</TableCell><TableCell className="text-xs">{l.fuelStation ?? "—"}</TableCell></TableRow>)}{logs.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No fuel logs</TableCell></TableRow>}</TableBody></Table></div>
        <div className="grid gap-2 md:hidden">{logs.map(l=> <div key={l.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between"><span className="font-semibold">{l.machine.name}</span><span className="font-mono">{l.litres} L</span></div><p className="text-xs text-muted-foreground">{new Date(l.date).toLocaleDateString()} • {l.operator.name}</p></div>)}</div>
      </CardContent></Card>
    );
  } else if (type === "maintenance") {
    const where: Record<string, unknown> = {};
    if (machineId) (where as Record<string,unknown>).machineId = machineId;
    if (startDate || endDate) (where as Record<string,unknown>).serviceDate = { ...(startDate?{gte:startDate}:{}), ...(endDate?{lte:endDate}:{}) };
    const records = await prisma.maintenanceRecord.findMany({ where: where as never, include: { machine: true }, orderBy: { serviceDate: "desc" }, take: 100 });
    content = (
      <Card><CardHeader><CardTitle>Maintenance Report {records.length} rows</CardTitle></CardHeader><CardContent>
        <div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Machine</TableHead><TableHead>Type</TableHead><TableHead>Meter</TableHead><TableHead>Cost</TableHead><TableHead>Provider</TableHead></TableRow></TableHeader><TableBody>{records.map(r=> <TableRow key={r.id}><TableCell className="text-xs">{new Date(r.serviceDate).toLocaleDateString()}</TableCell><TableCell><span className="font-semibold">{r.machine.name}</span><div className="text-xs font-mono">{r.machine.registrationNumber}</div></TableCell><TableCell className="text-xs">{r.serviceType}</TableCell><TableCell className="font-mono text-xs">{r.meterReading ?? "—"}</TableCell><TableCell className="text-xs">₹{r.totalCost ?? 0}</TableCell><TableCell className="text-xs">{r.serviceProvider ?? "—"}</TableCell></TableRow>)}{records.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No maintenance</TableCell></TableRow>}</TableBody></Table></div>
      </CardContent></Card>
    );
  } else if (type === "expense") {
    const where: Record<string, unknown> = {};
    if (machineId) (where as Record<string,unknown>).machineId = machineId;
    if (projectId) (where as Record<string,unknown>).jobSiteId = projectId;
    if (startDate || endDate) (where as Record<string,unknown>).date = { ...(startDate?{gte:startDate}:{}), ...(endDate?{lte:endDate}:{}) };
    const expenses = await prisma.expense.findMany({ where: where as never, include: { machine: true, jobSite: true }, orderBy: { date: "desc" }, take: 100 });
    content = (
      <Card><CardHeader><CardTitle>Expense Report {expenses.length} rows</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Machine/Site</TableHead><TableHead>Description</TableHead></TableRow></TableHeader><TableBody>{expenses.map(e=> <TableRow key={e.id}><TableCell className="text-xs">{new Date(e.date).toLocaleDateString()}</TableCell><TableCell><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{e.category}</span></TableCell><TableCell className="font-mono font-bold">₹{Number(e.amount).toLocaleString("en-IN")}</TableCell><TableCell className="text-xs">{e.machine ? e.machine.name : e.jobSite ? e.jobSite.name : "General"}</TableCell><TableCell className="text-xs truncate max-w-[200px]">{e.description ?? "—"}</TableCell></TableRow>)}{expenses.length===0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No expenses</TableCell></TableRow>}</TableBody></Table>
      </CardContent></Card>
    );
  } else if (type === "operator") {
    const where: Record<string, unknown> = {};
    if (operatorId) (where as Record<string,unknown>).operatorId = operatorId;
    if (machineId) (where as Record<string,unknown>).machineId = machineId;
    if (projectId) (where as Record<string,unknown>).jobSiteId = projectId;
    if (startDate || endDate) (where as Record<string,unknown>).startTime = { ...(startDate?{gte:startDate}:{}), ...(endDate?{lte:endDate}:{}) };
    const sessions = await prisma.workSession.findMany({ where: where as never, include: { machine: true, operator: true, jobSite: true }, orderBy: { startTime: "desc" }, take: 100 });
    const byOp = new Map<string, { name: string; hours: number; sessions: number }>();
    for (const s of sessions) {
      const key = s.operatorId;
      const cur = byOp.get(key) ?? { name: s.operator.name, hours: 0, sessions: 0 };
      cur.hours += s.workingHours ?? 0;
      cur.sessions += 1;
      byOp.set(key, cur);
    }
    content = (
      <Card><CardHeader><CardTitle>Operator Report — {sessions.length} sessions</CardTitle></CardHeader><CardContent>
        <div className="grid gap-3 md:grid-cols-3 mb-4">{[...byOp.entries()].map(([id, v])=> <Card key={id} className="border"><CardContent className="p-3 text-center"><p className="font-semibold">{v.name}</p><p className="text-xs text-muted-foreground">{v.sessions} sessions • {v.hours.toFixed(1)} h</p></CardContent></Card>)}</div>
        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Operator</TableHead><TableHead>Machine</TableHead><TableHead>Hours</TableHead><TableHead>Project</TableHead></TableRow></TableHeader><TableBody>{sessions.map(s=> <TableRow key={s.id}><TableCell className="text-xs">{new Date(s.startTime).toLocaleDateString()}</TableCell><TableCell className="text-xs">{s.operator.name}</TableCell><TableCell className="text-xs">{s.machine.name}</TableCell><TableCell className="font-mono">{s.workingHours?.toFixed(1) ?? "—"}</TableCell><TableCell className="text-xs">{s.jobSite?.name ?? "—"}</TableCell></TableRow>)}{sessions.length===0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No sessions</TableCell></TableRow>}</TableBody></Table>
      </CardContent></Card>
    );
  } else if (type === "project") {
    const sites = await prisma.jobSite.findMany({ include: { assignments: true } });
    const rows = await Promise.all(sites.filter(s=> !projectId || s.id===projectId).map(async s=>{
      const [workAgg, fuelAgg, expAgg, revAgg] = await Promise.all([
        prisma.workSession.aggregate({ where: { jobSiteId: s.id, status: "COMPLETED", ...(startDate||endDate?{startTime:{...(startDate?{gte:startDate}:{}),...(endDate?{lte:endDate}:{})}}:{} ) }, _sum: { workingHours: true } }),
        prisma.fuelLog.aggregate({ where: { jobSiteId: s.id, ...(startDate||endDate?{date:{...(startDate?{gte:startDate}:{}),...(endDate?{lte:endDate}:{})}}:{} ) }, _sum: { litres: true, totalCost: true } }),
        prisma.expense.aggregate({ where: { jobSiteId: s.id, category:{not:"FUEL"}, ...(startDate||endDate?{date:{...(startDate?{gte:startDate}:{}),...(endDate?{lte:endDate}:{})}}:{} ) }, _sum: { amount: true } }),
        prisma.revenue.aggregate({ where: { jobSiteId: s.id, ...(startDate||endDate?{createdAt:{...(startDate?{gte:startDate}:{}),...(endDate?{lte:endDate}:{})}}:{} ) }, _sum: { amount: true, amountReceived: true } }),
      ]);
      return { site: s, hours: workAgg._sum.workingHours ?? 0, litres: fuelAgg._sum.litres ?? 0, fuelCost: fuelAgg._sum.totalCost ?? 0, expCost: expAgg._sum.amount ?? 0, revenue: revAgg._sum.amount ?? 0 };
    }));
    content = (
      <Card><CardHeader><CardTitle>Project Report</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Hours</TableHead><TableHead>Fuel</TableHead><TableHead>Expenses</TableHead><TableHead>Revenue</TableHead><TableHead>Profit</TableHead></TableRow></TableHeader><TableBody>{rows.map(r=> { const profit = r.revenue - (r.expCost + r.fuelCost); return <TableRow key={r.site.id}><TableCell><span className="font-semibold">{r.site.name}</span><div className="text-xs text-muted-foreground">{r.site.clientName ?? "—"}</div></TableCell><TableCell className="font-mono">{r.hours.toFixed(1)}</TableCell><TableCell className="text-xs">{r.litres.toFixed(1)} L • ₹{r.fuelCost.toLocaleString("en-IN")}</TableCell><TableCell className="font-mono">₹{r.expCost.toLocaleString("en-IN")}</TableCell><TableCell className="font-mono">₹{r.revenue.toLocaleString("en-IN")}</TableCell><TableCell className={`font-mono font-bold ${profit>=0?"text-emerald-700":"text-red-700"}`}>₹{profit.toLocaleString("en-IN")}</TableCell></TableRow>; })}</TableBody></Table>
      </CardContent></Card>
    );
  } else if (type === "machine-daily") {
    const where: Record<string, unknown> = { status: "COMPLETED" };
    if (machineId) (where as Record<string,unknown>).machineId = machineId;
    if (startDate || endDate) (where as Record<string,unknown>).startTime = { ...(startDate?{gte:startDate}:{}), ...(endDate?{lte:endDate}:{}) };
    const sessions = await prisma.workSession.findMany({ where: where as never, include: { machine: true, operator: true, jobSite: true }, orderBy: { startTime: "desc" }, take: 100 });
    const byKey = new Map<string, { date: string; machine: string; hours: number; sessions: number }>();
    for (const s of sessions) {
      const d = new Date(s.startTime).toLocaleDateString();
      const key = `${d}-${s.machineId}`;
      const cur = byKey.get(key) ?? { date: d, machine: `${s.machine.name} • ${s.machine.registrationNumber}`, hours: 0, sessions: 0 };
      cur.hours += s.workingHours ?? 0;
      cur.sessions += 1;
      byKey.set(key, cur);
    }
    content = (
      <Card><CardHeader><CardTitle>Machine Daily — {byKey.size} rows</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Machine</TableHead><TableHead>Hours</TableHead><TableHead>Sessions</TableHead></TableRow></TableHeader><TableBody>{[...byKey.values()].map((r,i)=> <TableRow key={i}><TableCell className="text-xs">{r.date}</TableCell><TableCell className="text-xs">{r.machine}</TableCell><TableCell className="font-mono">{r.hours.toFixed(1)}</TableCell><TableCell>{r.sessions}</TableCell></TableRow>)}{byKey.size===0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No sessions</TableCell></TableRow>}</TableBody></Table>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Reports</h1><p className="text-sm text-muted-foreground">Filtered reports — export as CSV, Excel or PDF</p></div>
        <ExportButtons type={type} query={base} />
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORTS.map(r=> (
          <Link key={r.id} href={`/admin/reports?type=${r.id}${machineId?`&machineId=${machineId}`:""}${operatorId?`&operatorId=${operatorId}`:""}${projectId?`&projectId=${projectId}`:""}${start?`&start=${start}`:""}${end?`&end=${end}`:""}`} className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${type===r.id?"bg-[var(--charcoal)] text-white":"bg-card hover:bg-muted"}`}>{r.label}</Link>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-3 md:grid-cols-5">
            <input type="hidden" name="type" value={type} />
            <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">Machine</span><select aria-label="Filter by machine" name="machineId" defaultValue={machineId ?? ""} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="">All Machines</option>{machines.map(m=> <option key={m.id} value={m.id}>{m.name} • {m.registrationNumber}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">Operator</span><select aria-label="Filter by operator" name="operatorId" defaultValue={operatorId ?? ""} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="">All Operators</option>{operators.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">Project</span><select aria-label="Filter by project" name="projectId" defaultValue={projectId ?? ""} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="">All Projects</option>{sites.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">Start date</span><input aria-label="Start date" type="date" name="start" defaultValue={start ?? ""} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">End date</span><input aria-label="End date" type="date" name="end" defaultValue={end ?? ""} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" /></label>
            <div className="flex gap-2 md:col-span-5">
              <Button type="submit" variant="outline">Apply Filters</Button>
              <Button variant="ghost" asChild><Link href={`/admin/reports?type=${type}`}>Clear</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {content}
    </div>
  );
}