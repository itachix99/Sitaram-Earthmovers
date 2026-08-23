import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";
import { DeleteMachineButton } from "@/components/machines/delete-machine-button";

export default async function MachinesPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const type = params.type ?? "";
  const status = params.status ?? "";

  const where: Record<string, unknown> = {};
  if (q) {
    (where as { OR?: unknown[] }).OR = [
      { name: { contains: q } },
      { registrationNumber: { contains: q } },
      { manufacturer: { contains: q } },
      { model: { contains: q } },
    ];
  }
  if (type) (where as Record<string, unknown>).machineType = type;
  if (status) (where as Record<string, unknown>).status = status;

  const machines = await prisma.machine.findMany({
    where: where as never,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  const total = await prisma.machine.count();

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Machinery</h1>
          <p className="text-sm text-muted-foreground">{total} machines • {machines.length} shown • DB-driven</p>
        </div>
        <Button asChild><Link href="/admin/machines/new"><Plus className="h-4 w-4" /> Add Machine</Link></Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <form method="GET" className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={q} placeholder="Search by name, reg, manufacturer..." className="pl-9" />
            </div>
            <select name="type" defaultValue={type} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">All Types</option>
              <option value="JCB">JCB</option>
              <option value="EXCAVATOR">Excavator</option>
              <option value="TIPPER">Tipper</option>
              <option value="CRANE">Crane</option>
              <option value="BULLDOZER">Bulldozer</option>
              <option value="LOADER">Loader</option>
              <option value="TRACTOR">Tractor</option>
              <option value="DUMP_TRUCK">Dump Truck</option>
            </select>
            <select name="status" defaultValue={status} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="WORKING">Working</option>
              <option value="IDLE">Idle</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
              <option value="BROKEN_DOWN">Breakdown</option>
              <option value="RETIRED">Retired</option>
            </select>
            <Button type="submit" variant="outline"><Filter className="h-4 w-4" /> Filter</Button>
            {(q || type || status) && <Button variant="ghost" asChild><Link href="/admin/machines">Clear</Link></Button>}
          </form>
        </CardContent>
      </Card>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Machine</TableHead><TableHead>Registration</TableHead><TableHead>Type</TableHead><TableHead>Hour Meter</TableHead><TableHead>Status</TableHead><TableHead>Fuel Eff.</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines.map((m) => (
              <TableRow key={m.id}>
                <TableCell><Link href={`/admin/machines/${m.id}`} className="font-semibold hover:underline">{m.name}</Link><div className="text-xs text-muted-foreground">{m.manufacturer} {m.model}</div></TableCell>
                <TableCell className="font-mono text-xs">{m.registrationNumber}</TableCell>
                <TableCell>{m.machineType}</TableCell>
                <TableCell className="font-mono font-medium">{m.currentHourMeter.toFixed(1)} h</TableCell>
                <TableCell><StatusBadge status={m.status} /></TableCell>
                <TableCell className="font-mono text-xs">{m.expectedFuelEfficiency ? `${m.expectedFuelEfficiency} L/hr` : "—"}</TableCell>
                <TableCell><div className="flex items-center gap-2"><Link href={`/admin/machines/${m.id}`} className="text-xs font-semibold hover:underline">View</Link><DeleteMachineButton id={m.id} name={m.name} /></div></TableCell>
              </TableRow>
            ))}
            {machines.length===0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No machines match filters</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {machines.map((m)=>(
          <Card key={m.id}><CardContent className="p-4"><div className="flex justify-between items-start"><div><Link href={`/admin/machines/${m.id}`} className="font-bold hover:underline">{m.name}</Link><p className="text-xs font-mono text-muted-foreground">{m.registrationNumber} • {m.currentHourMeter.toFixed(1)} h</p><p className="text-xs text-muted-foreground mt-1">{m.machineType} • {m.manufacturer}</p></div><StatusBadge status={m.status} /></div><div className="mt-3 flex justify-end"><DeleteMachineButton id={m.id} name={m.name} variant="outline" /></div></CardContent></Card>
        ))}
      </div>
    </div>
  );
}