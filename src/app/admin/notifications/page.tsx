import { getNotifications, getActivityTimeline } from "@/lib/queries/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [notifications, activity] = await Promise.all([getNotifications(), getActivityTimeline(20)]);
  const critical = notifications.filter(n=>n.severity==="critical");
  const high = notifications.filter(n=>n.severity==="high");
  const medium = notifications.filter(n=>n.severity==="medium");
  const low = notifications.filter(n=>n.severity==="low");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Notifications & Activity</h1><p className="text-sm text-muted-foreground">{notifications.length} notifications • Activity timeline from all modules</p></div></div>

      {notifications.length===0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No notifications — all systems OK 🟢</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {critical.length>0 && <Card className="border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"><CardHeader><CardTitle className="text-red-800">Critical ({critical.length})</CardTitle></CardHeader><CardContent className="space-y-2">{critical.map(n=> <NotificationRow key={n.id} n={n} />)}</CardContent></Card>}
          {high.length>0 && <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10"><CardHeader><CardTitle className="text-amber-800">High ({high.length})</CardTitle></CardHeader><CardContent className="space-y-2">{high.map(n=> <NotificationRow key={n.id} n={n} />)}</CardContent></Card>}
          {medium.length>0 && <Card className="border-blue-200 bg-blue-50"><CardHeader><CardTitle className="text-blue-800">Medium ({medium.length})</CardTitle></CardHeader><CardContent className="space-y-2">{medium.map(n=> <NotificationRow key={n.id} n={n} />)}</CardContent></Card>}
          {low.length>0 && <Card><CardHeader><CardTitle>Low ({low.length})</CardTitle></CardHeader><CardContent className="space-y-2">{low.map(n=> <NotificationRow key={n.id} n={n} />)}</CardContent></Card>}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Activity Timeline — Last 20</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {activity.map(a=>(
            <div key={a.id} className="flex gap-3 border-b py-3 last:border-0">
              <div className={`h-2 w-2 rounded-full mt-2 ${a.type==="work"?"bg-emerald-500":a.type==="fuel"?"bg-amber-500":a.type==="breakdown"?"bg-red-500":a.type==="maintenance"?"bg-blue-500":a.type==="expense"?"bg-zinc-500":"bg-purple-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.time).toLocaleString()}</span>
            </div>
          ))}
          {activity.length===0 && <p className="text-sm text-muted-foreground">No activity yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationRow({ n }: { n: { id: string; title: string; message: string; severity: string; link?: string; createdAt: Date } }) {
  const content = (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-sm font-semibold">{n.title}</p>
      <p className="text-xs text-muted-foreground">{n.message}</p>
      <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()} • {n.severity}</p>
    </div>
  );
  return n.link ? <Link href={n.link} className="block hover:opacity-80">{content}</Link> : content;
}