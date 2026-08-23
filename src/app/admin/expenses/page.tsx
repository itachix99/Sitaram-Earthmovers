import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireAdmin();
  const { category } = await searchParams;
  const where: Record<string, unknown> = {};
  if (category) (where as Record<string, unknown>).category = category;
  const [expenses, machines, sites, totalAgg, revenueAgg] = await Promise.all([
    prisma.expense.findMany({ where: where as never, include: { machine: true, jobSite: true, createdBy: true }, orderBy: { date: "desc" }, take: 50 }),
    prisma.machine.findMany({ select: { id: true, name: true, registrationNumber: true }, orderBy: { name: "asc" } }),
    prisma.jobSite.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.revenue.aggregate({ _sum: { amount: true, amountReceived: true } }),
  ]);
  const totalExpense = totalAgg._sum.amount ?? 0;
  const totalRevenue = revenueAgg._sum.amount ?? 0;
  const profit = totalRevenue - totalExpense;

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div><h1 className="text-2xl font-bold tracking-tight">Expenses & Revenue</h1><p className="text-sm text-muted-foreground">Profitability • {expenses.length} expenses shown • Revenue estimated</p></div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">₹{totalRevenue.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString("en-IN")}</p></CardContent></Card>
        <Card className={profit>=0?"border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10":"border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"}><CardContent className="p-5 text-center"><p className="text-xs uppercase tracking-widest text-muted-foreground">Est. Profit</p><p className={`text-2xl font-bold ${profit>=0?"text-emerald-700":"text-red-700"}`}>₹{profit.toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground">Revenue - Expenses (estimated)</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Expenses</CardTitle>
              <form method="GET" className="flex gap-2">
                <select name="category" defaultValue={category ?? ""} className="h-8 rounded-md border border-input bg-card px-3 text-sm"><option value="">All Categories</option><option value="FUEL">Fuel</option><option value="MAINTENANCE">Maintenance</option><option value="REPAIR">Repair</option><option value="OPERATOR_PAYMENT">Operator</option><option value="TRANSPORT">Transport</option><option value="SPARE_PARTS">Spare Parts</option><option value="OTHER">Other</option></select>
                <button type="submit" className="h-8 rounded-md border bg-card px-3 text-sm">Filter</button>
              </form>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Machine/Site</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {expenses.map(e=>(
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{new Date(e.date).toLocaleDateString()}</TableCell>
                        <TableCell><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{e.category}</span></TableCell>
                        <TableCell className="font-mono font-bold">₹{Number(e.amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-xs">{e.machine ? `${e.machine.name} • ${e.machine.registrationNumber}` : e.jobSite ? e.jobSite.name : "—"}</TableCell>
                        <TableCell className="text-xs truncate max-w-[180px]">{e.description ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {expenses.length===0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No expenses</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-2 md:hidden">
                {expenses.map(e=> <div key={e.id} className="rounded-lg border p-3 text-sm"><div className="flex justify-between"><span className="font-semibold">{e.category}</span><span className="font-mono font-bold">₹{e.amount}</span></div><p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()} • {e.machine?.name ?? e.jobSite?.name ?? "General"}</p></div>)}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card><CardHeader><CardTitle>Record Expense</CardTitle></CardHeader><CardContent><ExpenseForm machines={machines} sites={sites} /></CardContent></Card>
          <Card className="mt-4"><CardHeader><CardTitle>Revenue Summary</CardTitle></CardHeader><CardContent className="text-sm space-y-2"><div className="flex justify-between"><span>Received</span><span className="font-mono">₹{(revenueAgg._sum.amountReceived ?? 0).toLocaleString("en-IN")}</span></div><div className="flex justify-between"><span>Pending</span><span className="font-mono">₹{((revenueAgg._sum.amount ?? 0) - (revenueAgg._sum.amountReceived ?? 0)).toLocaleString("en-IN")}</span></div><a href="/admin/revenue" className="text-xs font-semibold hover:underline">Go to Revenue →</a></CardContent></Card>
        </div>
      </div>
    </div>
  );
}