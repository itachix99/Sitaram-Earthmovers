import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { RevenueForm } from "@/components/revenue/revenue-form";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function RevenuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const where: Record<string, unknown> = {};
  if (status) (where as Record<string, unknown>).paymentStatus = status;
  const [revenues, machines, sites, totalAgg] = await Promise.all([
    prisma.revenue.findMany({ where: where as never, include: { jobSite: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.machine.findMany({ select: { id: true, name: true, registrationNumber: true }, orderBy: { name: "asc" } }),
    prisma.jobSite.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.revenue.aggregate({ _sum: { amount: true, amountReceived: true } }),
  ]);
  const total = totalAgg._sum.amount ?? 0;
  const received = totalAgg._sum.amountReceived ?? 0;
  const pending = total - received;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Revenue</h1><p className="text-sm text-muted-foreground">Invoices • {revenues.length} shown • Pending ₹{pending.toLocaleString("en-IN")}</p></div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">₹{total.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Received</p><p className="text-2xl font-bold text-emerald-700">₹{received.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-700">₹{pending.toLocaleString("en-IN")}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Invoices</CardTitle>
              <form method="GET" className="flex gap-2">
                <select name="status" defaultValue={status ?? ""} className="h-8 rounded-md border border-input bg-card px-3 text-sm"><option value="">All Status</option><option value="PENDING">Pending</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option></select>
                <button type="submit" className="h-8 rounded-md border bg-card px-3 text-sm">Filter</button>
              </form>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Project/Machine</TableHead><TableHead>Amount</TableHead><TableHead>Received</TableHead><TableHead>Status</TableHead><TableHead>Period</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {revenues.map(r=>(
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.invoiceNumber}</TableCell>
                        <TableCell className="text-xs">{r.jobSite ? r.jobSite.name : r.machineId ?? "—"}<div className="text-xs text-muted-foreground">{r.clientName ?? "—"}</div></TableCell>
                        <TableCell className="font-mono font-bold">₹{Number(r.amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-xs">₹{Number(r.amountReceived).toLocaleString("en-IN")}</TableCell>
                        <TableCell><StatusBadge status={r.paymentStatus} /></TableCell>
                        <TableCell className="text-xs">{r.billingStart ? new Date(r.billingStart).toLocaleDateString() : "—"} → {r.billingEnd ? new Date(r.billingEnd).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {revenues.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No revenue</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-2 md:hidden">
                {revenues.map(r=> <div key={r.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between"><span className="font-mono font-bold">{r.invoiceNumber}</span><StatusBadge status={r.paymentStatus} /></div><p className="text-xs text-muted-foreground">{r.clientName ?? "—"} • ₹{r.amount}</p></div>)}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card><CardHeader><CardTitle>Record Revenue</CardTitle></CardHeader><CardContent><RevenueForm machines={machines} sites={sites} /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}