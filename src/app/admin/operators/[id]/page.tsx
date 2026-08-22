import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { ArrowLeft, Pencil, Power } from "lucide-react";
import { toggleOperatorStatus } from "@/lib/actions/operators";
import { requireAdmin } from "@/lib/auth-guards";

export default async function OperatorDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const op = await prisma.operator.findUnique({ where: { id }, include: { user: true } });
  if (!op) notFound();
  const assignment = await prisma.assignment.findFirst({ where: { operatorId: op.userId, status: "ACTIVE" }, include: { machine: true, jobSite: true }, orderBy: { assignedAt: "desc" } });
  const sessions = await prisma.workSession.findMany({ where: { operatorId: op.userId }, include: { machine: true }, orderBy: { createdAt: "desc" }, take: 5 });
  // eslint-disable-next-line react-hooks/purity
  const isExpiring = op.licenseExpiry ? (new Date(op.licenseExpiry).getTime() - Date.now()) < 30*24*60*60*1000 : false;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild><Link href="/admin/operators"><ArrowLeft className="h-4 w-4" /> Back to Operators</Link></Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{op.user.name}</h1><StatusBadge status={op.status} /><span className="text-xs text-muted-foreground">OPERATOR • {op.user.phone}</span></div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href={`/admin/operators/${op.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
          <form action={async ()=>{"use server"; await toggleOperatorStatus(op.id)}}><Button variant="outline" type="submit"><Power className="h-4 w-4" /> {op.status==="ACTIVE"?"Deactivate":"Activate"}</Button></form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Profile</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Phone</span><span className="font-mono">{op.user.phone}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Email</span><span>{op.user.email ?? "—"}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">License</span><span>{op.licenseNumber ?? "—"} {op.licenseExpiry ? `(exp ${new Date(op.licenseExpiry).toLocaleDateString()})` : ""}</span></div>
          {op.licenseExpiry && isExpiring && <div className="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25 p-2 text-xs text-amber-800 dark:text-amber-300">⚠ License expiring soon</div>}
          <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Joining</span><span>{op.joiningDate ? new Date(op.joiningDate).toLocaleDateString() : "—"}</span></div>
          <div className="flex justify-between py-2"><span className="text-muted-foreground">Salary</span><span>₹{op.salaryAmount ?? "—"} / {op.salaryType.toLowerCase()}</span></div>
          <div className="flex justify-between py-2"><span className="text-muted-foreground">Role</span><span className="font-mono text-xs">{op.user.role}</span></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Current Assignment</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          {assignment ? (
            <div className="rounded-lg border p-3 space-y-1">
              <p className="font-semibold">{assignment.machine.name} • {assignment.machine.registrationNumber}</p>
              <p className="text-muted-foreground">{assignment.jobSite.name} • {assignment.jobSite.address ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Since {new Date(assignment.assignedAt).toLocaleDateString()}</p>
            </div>
          ) : <p className="text-muted-foreground">No active assignment</p>}
          <div className="pt-2 text-xs text-muted-foreground">History preserved — changing assignment does not rewrite past WorkSessions.</div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Recent Work Sessions</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        {sessions.length===0 ? <p className="text-muted-foreground">No sessions yet</p> : sessions.map(s=>(
          <div key={s.id} className="flex justify-between border-b py-2 last:border-0">
            <span>{new Date(s.startTime).toLocaleDateString()} • {s.machine.name} • {s.openingHourMeter.toFixed(1)} → {s.closingHourMeter ? `${s.closingHourMeter.toFixed(1)} h` : "active"} {s.workingHours?`(${s.workingHours.toFixed(1)} h)`:""}</span>
            <span className={s.status==="ACTIVE"?"text-amber-600":"text-emerald-600"}>{s.status}</span>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}