import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Plus, MapPin } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const { q, status } = await searchParams;
  const query = q?.trim() ?? "";
  const where: Record<string, unknown> = {};
  if (query) (where as { OR?: unknown[] }).OR = [{ name: { contains: query } }, { clientName: { contains: query } }, { address: { contains: query } }];
  if (status) (where as Record<string, unknown>).status = status;

  const sites = await prisma.jobSite.findMany({ where: where as never, orderBy: { createdAt: "desc" }, take: 50 });
  const total = await prisma.jobSite.count();
  const assignments = await prisma.assignment.groupBy({ by: ["jobSiteId"], where: { status: "ACTIVE" }, _count: { jobSiteId: true } });
  const countMap = new Map(assignments.map(a=>[a.jobSiteId, a._count.jobSiteId]));

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex flex-wrap justify-between items-start gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Job Sites / Projects</h1><p className="text-sm text-muted-foreground">{total} sites • {sites.length} shown • Assignments preserved</p></div><Button asChild><Link href="/admin/projects/new"><Plus className="h-4 w-4" /> Add Site</Link></Button></div>

      <Card><CardContent className="p-4">
        <form method="GET" className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={query} placeholder="Search site, client, address..." className="pl-9" /></div>
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-md border border-input bg-card px-3 text-sm"><option value="">All Status</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On Hold</option><option value="COMPLETED">Completed</option></select>
          <Button type="submit" variant="outline">Filter</Button>
          {(query || status) && <Button variant="ghost" asChild><Link href="/admin/projects">Clear</Link></Button>}
        </form>
      </CardContent></Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((s)=> (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex justify-between items-start gap-2"><Link href={`/admin/projects/${s.id}`} className="font-bold hover:underline leading-tight">{s.name}</Link><StatusBadge status={s.status} /></div>
              <p className="text-sm text-muted-foreground mt-1">{s.clientName ?? "—"} • {s.address ?? "—"}</p>
              <div className="mt-4 flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Machines</span><span className="font-semibold">{countMap.get(s.id) ?? 0}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Billing</span><span className="font-mono text-xs">{s.billingType} {s.rate ? `• ₹${Number(s.rate).toLocaleString("en-IN")}` : ""}</span></div>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild><Link href={`/admin/projects/${s.id}`}>View Details</Link></Button>
            </CardContent>
          </Card>
        ))}
        {sites.length===0 && <Card className="md:col-span-3"><CardContent className="p-8 text-center text-muted-foreground">No sites match filters</CardContent></Card>}
      </div>
    </div>
  );
}