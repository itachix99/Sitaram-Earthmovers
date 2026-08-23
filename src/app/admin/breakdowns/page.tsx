import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BreakdownStatusForm } from "@/components/breakdowns/breakdown-status-form";
import { requireAdmin } from "@/lib/auth-guards";

export default async function BreakdownsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const where: Record<string, unknown> = {};
  if (status) (where as Record<string, unknown>).status = status;
  const reports = await prisma.breakdownReport.findMany({ where: where as never, include: { machine: true, operator: true }, orderBy: { reportedAt: "desc" }, take: 50 });
  const openCount = await prisma.breakdownReport.count({ where: { status: "OPEN" } });
  const inProgressCount = await prisma.breakdownReport.count({ where: { status: "IN_PROGRESS" } });

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Breakdowns</h1><p className="text-sm text-muted-foreground">{reports.length} reports • {openCount} open • {inProgressCount} in progress</p></div></div>

      <div className="flex gap-2">
        <a href="/admin/breakdowns" className={`rounded-full px-3 py-1 text-xs font-semibold border ${!status?"bg-[var(--charcoal)] text-white":"bg-card"}`}>All</a>
        <a href="/admin/breakdowns?status=OPEN" className={`rounded-full px-3 py-1 text-xs font-semibold border ${status==="OPEN"?"bg-red-600 text-white":"bg-card"}`}>Open</a>
        <a href="/admin/breakdowns?status=IN_PROGRESS" className={`rounded-full px-3 py-1 text-xs font-semibold border ${status==="IN_PROGRESS"?"bg-amber-500 text-white":"bg-card"}`}>In Progress</a>
        <a href="/admin/breakdowns?status=RESOLVED" className={`rounded-full px-3 py-1 text-xs font-semibold border ${status==="RESOLVED"?"bg-emerald-600 text-white":"bg-card"}`}>Resolved</a>
      </div>

      <Card>
        <CardHeader><CardTitle>Breakdown Queue</CardTitle></CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Reported</TableHead><TableHead>Machine</TableHead><TableHead>Issue</TableHead><TableHead>Severity</TableHead><TableHead>Operator</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {reports.map(r=>(
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.reportedAt).toLocaleString()}</TableCell>
                    <TableCell><span className="font-semibold">{r.machine.name}</span><div className="text-xs font-mono">{r.machine.registrationNumber}</div></TableCell>
                    <TableCell><span className="font-medium">{r.issue}</span><div className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description ?? "—"}</div></TableCell>
                    <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.severity==="CRITICAL"?"bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300":r.severity==="HIGH"?"bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300":r.severity==="MEDIUM"?"bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300":"bg-zinc-100 dark:bg-zinc-500/15 dark:text-zinc-300"}`}>{r.severity}</span></TableCell>
                    <TableCell className="text-xs">{r.operator.name}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell><BreakdownStatusForm id={r.id} currentStatus={r.status} /></TableCell>
                  </TableRow>
                ))}
                {reports.length===0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No breakdown reports</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 md:hidden">
            {reports.map(r=>(
              <Card key={r.id} className="border">
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between"><p className="font-semibold">{r.machine.name}</p><StatusBadge status={r.status} /></div>
                  <p className="text-sm">{r.issue} • {r.severity}</p>
                  <p className="text-xs text-muted-foreground">{r.operator.name} • {new Date(r.reportedAt).toLocaleDateString()}</p>
                  <BreakdownStatusForm id={r.id} currentStatus={r.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}