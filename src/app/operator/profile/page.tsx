import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await requireActiveUser();
  const assignment = await prisma.assignment.findFirst({
    where: { operatorId: user.id, status: "ACTIVE" },
    include: { machine: true, jobSite: true },
    orderBy: { assignedAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-mono">{user.phone}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Role</span>
            <StatusBadge status="ACTIVE" />
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Assigned Machine</span>
            <span className="font-semibold">
              {assignment ? `${assignment.machine.name}` : "Not assigned"}
            </span>
          </div>
          {assignment?.jobSite && (
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Job Site</span>
              <span className="font-semibold">{assignment.jobSite.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
