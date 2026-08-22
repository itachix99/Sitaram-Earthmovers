import { requireActiveUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock3, Fuel, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { StartWorkForm } from "@/components/operator/start-work-form";
import { EndWorkForm } from "@/components/operator/end-work-form";
import { PhotoButton } from "@/components/operator/photo-button";

export default async function OperatorTodayPage() {
  const user = await requireActiveUser();
  const userId = user.id;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  const assignment = await prisma.assignment.findFirst({
    where: { operatorId: userId, status: "ACTIVE" },
    include: { machine: true, jobSite: true },
    orderBy: { assignedAt: "desc" },
  });

  const activeSession = await prisma.workSession.findFirst({
    where: { operatorId: userId, status: "ACTIVE" },
    include: { machine: true, jobSite: true },
    orderBy: { startTime: "desc" },
  });

  const recent = await prisma.workSession.findMany({
    where: { operatorId: userId },
    include: { machine: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const machine = assignment?.machine ?? activeSession?.machine ?? null;
  const site = assignment?.jobSite ?? activeSession?.jobSite ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Today&apos;s Assignment</h1>
        <p className="text-sm text-muted-foreground">{dateStr} • {user.name} • {user.role}</p>
      </div>

      {!assignment && !activeSession ? (
        <Card><CardContent className="p-6 text-center"><p className="font-semibold">No active assignment</p><p className="text-sm text-muted-foreground mt-1">Contact your admin to get a machine &amp; site assigned. Work cannot start without an active assignment.</p></CardContent></Card>
      ) : (
        <Card className="overflow-hidden border-[var(--charcoal)]/10">
          <div className="bg-[var(--charcoal)] px-4 py-3 text-white flex justify-between items-center">
            <div><p className="text-xs uppercase tracking-widest text-white/60">Machine Assigned</p><p className="font-bold">{machine ? `${machine.name} • ${machine.registrationNumber}` : "—"}</p></div>
            <StatusBadge status={machine?.status ?? "ACTIVE"} className="bg-emerald-500 text-white border-0" />
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {site ? `${site.name} • ${site.address ?? "—"}` : "No site"}</div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Current Meter</span><span className="font-mono font-bold">{machine ? `${machine.currentHourMeter.toFixed(1)} h` : "—"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Operator</span><span className="font-semibold">{user.name}</span></div>
          </CardContent>
        </Card>
      )}

      {!activeSession ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Start Work</CardTitle></CardHeader>
          <CardContent>
            {assignment ? (
              <StartWorkForm machineId={assignment.machineId} jobSiteId={assignment.jobSiteId} currentMeter={assignment.machine.currentHourMeter} />
            ) : (
              <p className="text-sm text-muted-foreground">No assignment to start. If you have a machine, ask admin to assign.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-emerald-800 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Active Session</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span>Started</span><span className="font-mono font-bold">{new Date(activeSession.startTime).toLocaleTimeString()} • {activeSession.openingHourMeter.toFixed(1)} h</span></div>
            <div className="flex justify-between text-sm"><span>Machine</span><span className="font-semibold">{activeSession.machine.name}</span></div>
            <div className="sticky top-14 z-20 -mx-1 rounded-xl border bg-card/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-card/85">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-11 flex-col gap-0.5" asChild><Link href="/operator/fuel"><Fuel className="h-4 w-4" /> Fuel</Link></Button>
                <Button variant="outline" className="h-11 flex-col gap-0.5" asChild><Link href="/operator/report-issue"><AlertTriangle className="h-4 w-4" /> Issue</Link></Button>
                <PhotoButton />
              </div>
            </div>
            <EndWorkForm sessionId={activeSession.id} openingMeter={activeSession.openingHourMeter} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recent.length===0 ? <p className="text-muted-foreground">No sessions yet</p> : recent.map(s=>(
            <div key={s.id} className="flex justify-between border-b py-2 last:border-0">
              <span>{new Date(s.startTime).toLocaleDateString()} • {s.machine.name} • {s.openingHourMeter.toFixed(1)} → {s.closingHourMeter ? `${s.closingHourMeter.toFixed(1)} h` : "active"} {s.workingHours ? `(${s.workingHours.toFixed(1)} h)` : ""}</span>
              <span className={s.status==="ACTIVE"?"text-amber-600":"text-emerald-600"}>{s.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}