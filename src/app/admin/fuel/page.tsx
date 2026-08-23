import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";

export default async function FuelPage({ searchParams }: { searchParams: Promise<{ q?: string; machineId?: string }> }) {
  await requireAdmin();
  const { q, machineId } = await searchParams;
  const query = q?.trim() ?? "";
  const where: Record<string, unknown> = {};
  if (query) (where as { OR?: unknown[] }).OR = [{ fuelStation: { contains: query } }, { notes: { contains: query } }, { machine: { registrationNumber: { contains: query } } }];
  if (machineId) (where as Record<string, unknown>).machineId = machineId;

  const [logs, machines] = await Promise.all([
    prisma.fuelLog.findMany({ where: where as never, include: { machine: true, operator: true, jobSite: true }, orderBy: { date: "desc" }, take: 50 }),
    prisma.machine.findMany({ select: { id: true, name: true, registrationNumber: true, expectedFuelEfficiency: true }, orderBy: { name: "asc" } }),
  ]);

  const totalLitres = logs.reduce((s, l)=> s + l.litres, 0);
  const totalCost = logs.reduce((s,l)=> s + (l.totalCost ?? 0), 0);

  // Efficiency per machine: total fuel / total working hours
  const machineStats = await Promise.all(machines.map(async m=>{
    const fuel = await prisma.fuelLog.aggregate({ where: { machineId: m.id }, _sum: { litres: true } });
    const work = await prisma.workSession.aggregate({ where: { machineId: m.id, status: "COMPLETED" }, _sum: { workingHours: true } });
    const litres = fuel._sum.litres ?? 0;
    const hours = work._sum.workingHours ?? 0;
    const actual = hours>0 ? litres / hours : null;
    const expected = m.expectedFuelEfficiency;
    let diff: number | null = null;
    let status: "ok" | "warning" | "danger" = "ok";
    if (actual !== null && expected) {
      diff = ((actual - expected) / expected) * 100;
      if (diff > 30) status = "danger";
      else if (diff > 10) status = "warning";
    }
    return { machine: m, litres, hours, actual, expected, diff, status };
  }));
  const filteredStats = machineId ? machineStats.filter(s=>s.machine.id===machineId) : machineStats;

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Fuel</h1><p className="text-sm text-muted-foreground">Logs, efficiency L/hr and cost — DB-driven</p></div></div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Total Fuel (shown)</p><p className="text-2xl font-bold font-mono">{totalLitres.toFixed(1)} L</p><p className="text-xs text-muted-foreground">{logs.length} logs</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Total Cost (shown)</p><p className="text-2xl font-bold">₹{totalCost.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Avg L/hr (overall)</p><p className="text-2xl font-bold font-mono">{(() => { const litres = machineStats.reduce((s,m)=>s+m.litres,0); const hours = machineStats.reduce((s,m)=>s+m.hours,0); return hours>0 ? (litres/hours).toFixed(2) : "—"; })()} </p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <form method="GET" className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={query} placeholder="Search station, notes, reg..." className="pl-9" /></div>
          <select name="machineId" defaultValue={machineId ?? ""} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
            <option value="">All Machines</option>
            {machines.map(m=> <option key={m.id} value={m.id}>{m.name} • {m.registrationNumber}</option>)}
          </select>
          <Button type="submit" variant="outline">Filter</Button>
          {(query || machineId) && <Button variant="ghost" asChild><Link href="/admin/fuel">Clear</Link></Button>}
        </form>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Fuel Efficiency by Machine</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {filteredStats.map(s=>(
            <div key={s.machine.id} className={`rounded-xl border p-3 ${s.status==="danger"?"bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/25":s.status==="warning"?"bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25":"bg-card"}`}>
              <div className="flex justify-between"><p className="font-semibold">{s.machine.name}</p><span className="text-xs font-mono">{s.machine.registrationNumber}</span></div>
              <div className="flex justify-between text-sm mt-2"><span>Actual</span><span className="font-mono font-bold">{s.actual!==null?`${s.actual.toFixed(2)} L/hr`:"—"}</span></div>
              <div className="flex justify-between text-sm"><span>Expected</span><span className="font-mono">{s.expected ? `${s.expected} L/hr` : "—"}</span></div>
              {s.diff!==null && <div className={`mt-2 rounded-lg p-2 text-xs ${s.status==="danger"?"bg-red-100 text-red-800":s.status==="warning"?"bg-amber-100 text-amber-800":"bg-emerald-100 text-emerald-800"}`}>{s.diff>0?`+${s.diff.toFixed(1)}% higher than expected`:`${s.diff.toFixed(1)}% lower`} {s.status==="danger"?"⚠ High consumption":""}</div>}
              <div className="text-xs text-muted-foreground mt-1">{s.litres.toFixed(1)} L / {s.hours.toFixed(1)} h</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="hidden md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Machine</TableHead><TableHead>Operator</TableHead><TableHead>Litres</TableHead><TableHead>Cost</TableHead><TableHead>Meter</TableHead><TableHead>Station</TableHead></TableRow></TableHeader>
          <TableBody>
            {logs.map(l=>(
              <TableRow key={l.id}>
                <TableCell className="text-xs">{new Date(l.date).toLocaleDateString()}</TableCell>
                <TableCell><Link href={`/admin/machines/${l.machineId}`} className="font-semibold hover:underline">{l.machine.name}</Link><div className="text-xs font-mono">{l.machine.registrationNumber}</div></TableCell>
                <TableCell className="text-xs">{l.operator.name}</TableCell>
                <TableCell className="font-mono font-bold">{l.litres} L</TableCell>
                <TableCell className="text-xs">{l.totalCost ? `₹${l.totalCost}` : "—"} {l.costPerLitre ? `@${l.costPerLitre}` : ""}</TableCell>
                <TableCell className="font-mono text-xs">{l.meterReading ? `${l.meterReading} h` : "—"}</TableCell>
                <TableCell className="text-xs">{l.fuelStation ?? "—"}</TableCell>
              </TableRow>
            ))}
            {logs.length===0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No fuel logs</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {logs.map(l=>(
          <Card key={l.id}><CardContent className="p-3"><div className="flex justify-between"><p className="font-semibold">{l.machine.name}</p><span className="font-mono text-xs">{l.litres} L</span></div><p className="text-xs text-muted-foreground">{new Date(l.date).toLocaleDateString()} • {l.operator.name} • {l.fuelStation ?? "—"}</p></CardContent></Card>
        ))}
      </div>
    </div>
  );
}