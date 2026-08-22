import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as unknown as { id: string }).id;
  const sessions = await prisma.workSession.findMany({
    where: { operatorId: userId },
    include: { machine: true, jobSite: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const totalHours = sessions.filter(s=>s.workingHours).reduce((sum,s)=>sum+(s.workingHours ?? 0),0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Work History</h1>
      <Card><CardContent className="p-4 flex justify-between text-sm"><span>Total Sessions</span><span className="font-bold">{sessions.length}</span><span>Total Hours</span><span className="font-mono font-bold">{totalHours.toFixed(1)} h</span></CardContent></Card>
      <Card>
        <CardHeader><CardTitle>All Sessions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {sessions.length===0 ? <p className="text-sm text-muted-foreground">No sessions yet — start work from Today.</p> : sessions.map(s=>(
            <div key={s.id} className="rounded-xl border p-3 space-y-1">
              <div className="flex justify-between items-start"><p className="font-semibold">{s.machine.name} • {s.machine.registrationNumber}</p><StatusBadge status={s.status} /></div>
              <p className="text-xs text-muted-foreground">{s.jobSite?.name ?? "No site"} • {new Date(s.startTime).toLocaleString()}</p>
              <div className="flex justify-between text-sm font-mono"><span>{s.openingHourMeter.toFixed(1)} → {s.closingHourMeter ? `${s.closingHourMeter.toFixed(1)} h` : "active"}</span><span>{s.workingHours ? `${s.workingHours.toFixed(1)} h` : "—"}</span></div>
              {s.notes && <p className="text-xs bg-muted p-2 rounded">{s.notes}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
