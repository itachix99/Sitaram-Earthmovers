import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";
import { DeleteOperatorButton } from "@/components/operators/delete-operator-button";

export default async function OperatorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const operators = await prisma.operator.findMany({
    where: query ? {
      OR: [
        { user: { name: { contains: query } } },
        { user: { phone: { contains: query } } },
        { user: { email: { contains: query } } },
        { licenseNumber: { contains: query } },
      ]
    } : undefined,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const total = await prisma.operator.count();
  const assignments = await prisma.assignment.findMany({ where: { status: "ACTIVE" }, include: { machine: true, jobSite: true } });
  const assignMap = new Map(assignments.map(a=> [a.operatorId, a]));

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Operators</h1><p className="text-sm text-muted-foreground">{total} operators • {operators.length} shown • User+Operator linked</p></div>
        <Button asChild><Link href="/admin/operators/new"><Plus className="h-4 w-4" /> Add Operator</Link></Button>
      </div>
      <Card><CardContent className="p-4">
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={query} placeholder="Search name, phone, license..." className="pl-9" /></div>
          <Button type="submit" variant="outline">Search</Button>
          {query && <Button variant="ghost" asChild><Link href="/admin/operators">Clear</Link></Button>}
        </form>
      </CardContent></Card>

      <div className="hidden md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Operator</TableHead><TableHead>Phone</TableHead><TableHead>License</TableHead><TableHead>Assignment</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {operators.map((op)=>{
              const assign = assignMap.get(op.userId);
              return (
                <TableRow key={op.id}>
                  <TableCell><Link href={`/admin/operators/${op.id}`} className="font-semibold hover:underline">{op.user.name}</Link><div className="text-xs text-muted-foreground">{op.user.email ?? "—"}</div></TableCell>
                  <TableCell className="font-mono text-xs">{op.user.phone}</TableCell>
                  <TableCell className="text-xs">{op.licenseNumber ?? "—"} {op.licenseExpiry ? `• exp ${new Date(op.licenseExpiry).toLocaleDateString()}`:""}</TableCell>
                  <TableCell className="text-xs">{assign ? `${assign.machine.name} • ${assign.jobSite.name}` : "Unassigned"}</TableCell>
                  <TableCell><StatusBadge status={op.status} /></TableCell>
                  <TableCell><div className="flex items-center gap-2"><Link href={`/admin/operators/${op.id}`} className="text-xs font-semibold hover:underline">View</Link><DeleteOperatorButton id={op.id} name={op.user.name} /></div></TableCell>
                </TableRow>
              );
            })}
            {operators.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No operators found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {operators.map((op)=>{
          const assign = assignMap.get(op.userId);
          return (
            <Card key={op.id}><CardContent className="p-4"><div className="flex justify-between gap-3"><div><Link href={`/admin/operators/${op.id}`} className="font-semibold hover:underline">{op.user.name}</Link><p className="text-xs font-mono text-muted-foreground">{op.user.phone} • {op.licenseNumber ?? "—"}</p><p className="text-xs text-muted-foreground">{assign ? `${assign.machine.name} @ ${assign.jobSite.name}`:"Unassigned"}</p></div><StatusBadge status={op.status} /></div><div className="mt-3 flex justify-end gap-2"><Link href={`/admin/operators/${op.id}`} className="text-xs font-semibold hover:underline self-center">View</Link><DeleteOperatorButton id={op.id} name={op.user.name} variant="outline" /></div></CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
