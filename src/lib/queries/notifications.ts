import { prisma } from "@/lib/prisma";

export type NotificationItem = {
  id: string;
  type: "maintenance_overdue" | "maintenance_approaching" | "breakdown_open" | "fuel_high" | "idle_long" | "missing_report";
  title: string;
  message: string;
  machineId?: string;
  machineName?: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  link?: string;
};

export async function getNotifications(): Promise<NotificationItem[]> {
  const notifications: NotificationItem[] = [];
  const machines = await prisma.machine.findMany();
  const now = new Date();

  // Maintenance overdue / approaching
  for (const m of machines) {
    if (m.status === "RETIRED") continue;
    if (m.lastServiceMeter === null) continue;
    const next = (m.lastServiceMeter ?? 0) + (m.serviceIntervalHours ?? 500);
    const remaining = next - m.currentHourMeter;
    if (remaining <= 0) {
      notifications.push({
        id: `maint-overdue-${m.id}`,
        type: "maintenance_overdue",
        title: `Maintenance overdue — ${m.name}`,
        message: `${m.registrationNumber} overdue by ${Math.abs(remaining).toFixed(0)} h (next ${next.toFixed(1)} h, current ${m.currentHourMeter.toFixed(1)} h)`,
        machineId: m.id,
        machineName: m.name,
        severity: "critical",
        createdAt: now,
        link: `/admin/machines/${m.id}`,
      });
    } else if (remaining <= 100) {
      notifications.push({
        id: `maint-approaching-${m.id}`,
        type: "maintenance_approaching",
        title: `Maintenance approaching — ${m.name}`,
        message: `${m.registrationNumber} due in ${remaining.toFixed(0)} h (next ${next.toFixed(1)} h)`,
        machineId: m.id,
        machineName: m.name,
        severity: "high",
        createdAt: now,
        link: `/admin/machines/${m.id}`,
      });
    }
  }

  // Breakdown OPEN
  const openBreakdowns = await prisma.breakdownReport.findMany({ where: { status: "OPEN" }, include: { machine: true }, take: 20 });
  for (const b of openBreakdowns) {
    notifications.push({
      id: `breakdown-${b.id}`,
      type: "breakdown_open",
      title: `Breakdown reported — ${b.machine.name}`,
      message: `${b.issue} • ${b.severity} • reported ${new Date(b.reportedAt).toLocaleDateString()}`,
      machineId: b.machineId,
      machineName: b.machine.name,
      severity: b.severity === "CRITICAL" ? "critical" : b.severity === "HIGH" ? "high" : "medium",
      createdAt: b.reportedAt,
      link: "/admin/breakdowns",
    });
  }

  // Fuel high (>30% over expected)
  const since = new Date(); since.setDate(since.getDate()-30);
  for (const m of machines) {
    if (!m.expectedFuelEfficiency) continue;
    const fuelAgg = await prisma.fuelLog.aggregate({ where: { machineId: m.id, date: { gte: since } }, _sum: { litres: true } });
    const workAgg = await prisma.workSession.aggregate({ where: { machineId: m.id, status: "COMPLETED", startTime: { gte: since } }, _sum: { workingHours: true } });
    const litres = fuelAgg._sum.litres ?? 0;
    const hours = workAgg._sum.workingHours ?? 0;
    if (hours > 5 && litres > 0) {
      const actual = litres / hours;
      const diff = ((actual - m.expectedFuelEfficiency)/m.expectedFuelEfficiency)*100;
      if (diff > 30) {
        notifications.push({
          id: `fuel-high-${m.id}`,
          type: "fuel_high",
          title: `High fuel consumption — ${m.name}`,
          message: `${actual.toFixed(2)} L/hr vs expected ${m.expectedFuelEfficiency} L/hr (+${diff.toFixed(0)}%)`,
          machineId: m.id,
          machineName: m.name,
          severity: "high",
          createdAt: now,
          link: `/admin/fuel?machineId=${m.id}`,
        });
      }
    }
  }

  // Idle >7 days (no work session in 7 days, status IDLE or ACTIVE but not WORKING/BROKEN)
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate()-7);
  for (const m of machines) {
    if (m.status !== "IDLE" && m.status !== "ACTIVE") continue;
    const lastSession = await prisma.workSession.findFirst({ where: { machineId: m.id }, orderBy: { startTime: "desc" } });
    if (!lastSession || lastSession.startTime < sevenDaysAgo) {
      notifications.push({
        id: `idle-${m.id}`,
        type: "idle_long",
        title: `Machine idle >7 days — ${m.name}`,
        message: `${m.registrationNumber} • ${m.status} • last work ${lastSession ? new Date(lastSession.startTime).toLocaleDateString() : "never"}`,
        machineId: m.id,
        machineName: m.name,
        severity: "medium",
        createdAt: now,
        link: `/admin/machines/${m.id}`,
      });
    }
  }

  // Missing daily report (ACTIVE assignment but no session today)
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const assignments = await prisma.assignment.findMany({ where: { status: "ACTIVE" }, include: { machine: true } });
  for (const a of assignments) {
    const sessionToday = await prisma.workSession.findFirst({ where: { operatorId: a.operatorId, machineId: a.machineId, startTime: { gte: todayStart } } });
    if (!sessionToday) {
      const user = await prisma.user.findUnique({ where: { id: a.operatorId } });
      notifications.push({
        id: `missing-report-${a.id}`,
        type: "missing_report",
        title: `Missing daily report — ${a.machine.name}`,
        message: `${user?.name ?? a.operatorId} has not submitted report today at ${a.machine.name}`,
        machineId: a.machineId,
        machineName: a.machine.name,
        severity: "low",
        createdAt: now,
        link: `/admin/machines/${a.machineId}`,
      });
    }
  }

  // Sort by severity then date
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  notifications.sort((a,b)=> order[a.severity] - order[b.severity] || b.createdAt.getTime() - a.createdAt.getTime());
  return notifications;
}

export async function getActivityTimeline(limit = 30) {
  const [workSessions, fuelLogs, maintenance, breakdowns, expenses, revenues] = await Promise.all([
    prisma.workSession.findMany({ include: { machine: true, operator: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.fuelLog.findMany({ include: { machine: true, operator: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.maintenanceRecord.findMany({ include: { machine: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.breakdownReport.findMany({ include: { machine: true, operator: true }, orderBy: { reportedAt: "desc" }, take: 5 }),
    prisma.expense.findMany({ include: { machine: true, jobSite: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.revenue.findMany({ include: { jobSite: true }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  type Activity = { id: string; time: Date; title: string; detail: string; type: string };
  const activities: Activity[] = [];
  for (const s of workSessions) activities.push({ id: `ws-${s.id}`, time: s.createdAt, title: `Work ${s.status === "ACTIVE" ? "started" : "completed"} — ${s.machine.name}`, detail: `${s.operator.name} • ${s.openingHourMeter.toFixed(1)} → ${s.closingHourMeter ? `${s.closingHourMeter.toFixed(1)} h` : "active"} ${s.workingHours ? `(${s.workingHours.toFixed(1)} h)` : ""}`, type: "work" });
  for (const f of fuelLogs) activities.push({ id: `fuel-${f.id}`, time: f.createdAt, title: `${f.litres} L fuel — ${f.machine.name}`, detail: `${f.operator.name} • ${f.fuelStation ?? "—"} • ₹${f.totalCost ?? "—"}`, type: "fuel" });
  for (const m of maintenance) activities.push({ id: `maint-${m.id}`, time: m.createdAt, title: `Maintenance — ${m.machine.name}`, detail: `${m.serviceType} • ${m.meterReading ?? "—"} h • ₹${m.totalCost ?? 0}`, type: "maintenance" });
  for (const b of breakdowns) activities.push({ id: `break-${b.id}`, time: b.reportedAt, title: `Breakdown ${b.status} — ${b.machine.name}`, detail: `${b.issue} • ${b.severity} • ${b.operator.name}`, type: "breakdown" });
  for (const e of expenses) activities.push({ id: `exp-${e.id}`, time: e.createdAt, title: `Expense ${e.category} — ₹${e.amount}`, detail: `${e.machine?.name ?? e.jobSite?.name ?? "General"} • ${e.description ?? "—"}`, type: "expense" });
  for (const r of revenues) activities.push({ id: `rev-${r.id}`, time: r.createdAt, title: `Revenue ${r.invoiceNumber} — ₹${r.amount}`, detail: `${r.jobSite?.name ?? r.machineId ?? "—"} • ${r.paymentStatus}`, type: "revenue" });
  activities.sort((a,b)=> b.time.getTime() - a.time.getTime());
  return activities.slice(0, limit);
}
