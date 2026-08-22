import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-guards";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const dynamic = "force-dynamic";

type Cell = string | number | null;
type ReportData = { title: string; headers: string[]; rows: Cell[][] };

function csvEscape(v: Cell): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(data: ReportData): string {
  const lines = [data.headers.map(csvEscape).join(","), ...data.rows.map((r) => r.map(csvEscape).join(","))];
  return lines.join("\n");
}

async function toXlsx(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sitaram Earthmovers";
  const ws = wb.addWorksheet(data.title.slice(0, 31));
  ws.addRow(data.headers);
  for (const row of data.rows) {
    ws.addRow(row.map((c) => (c === null ? null : c)) as ExcelJS.CellValue[]);
  }
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FF0F1113" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5B400" } };
  header.height = 20;
  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      maxLen = Math.max(maxLen, String(cell.value ?? "").length + 2);
    });
    col.width = Math.min(40, maxLen);
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: data.headers.length } };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function toPdf(data: ReportData): Buffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(14);
  doc.text(`Sitaram Earthmovers - ${data.title}`, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Generated ${new Date().toLocaleString()} - amounts in INR`, 40, 52);
  doc.setTextColor(0);
  autoTable(doc, {
    head: [data.headers],
    body: data.rows.map((r) => r.map((c) => (c === null ? "" : String(c)))),
    startY: 64,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [245, 180, 0], textColor: [15, 17, 19], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 247, 245] },
    margin: { left: 40, right: 40 },
    tableWidth: pageWidth - 80,
  });
  return Buffer.from(doc.output("arraybuffer"));
}

/** Filesystem-safe "YYYY-MM-DD_HH-MM" stamp for export filenames. */
function fileStamp(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

/** Attachment header: ASCII fallback + RFC 5987 UTF-8 name. */
function attachmentHeader(filename: string): string {
  return `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

async function getReportData(type: string, machineId: string | null, operatorId: string | null, projectId: string | null, start: string | null, end: string | null): Promise<ReportData> {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);
  const dateFilter = (field: string): Record<string, unknown> => ({
    [field]: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) },
  });

  if (type === "fuel") {
    const where: Record<string, unknown> = {};
    if (machineId) where.machineId = machineId;
    if (startDate || endDate) Object.assign(where, dateFilter("date"));
    const logs = await prisma.fuelLog.findMany({ where: where as never, include: { machine: true, operator: true }, orderBy: { date: "desc" }, take: 1000 });
    return {
      title: "Fuel Report",
      headers: ["Date", "Machine", "Registration", "Operator", "Litres", "CostPerLitre", "TotalCost", "Meter", "Station"],
      rows: logs.map((l) => [new Date(l.date).toLocaleDateString(), l.machine.name, l.machine.registrationNumber, l.operator.name, l.litres, l.costPerLitre ?? null, l.totalCost ?? null, l.meterReading ?? null, l.fuelStation ?? ""]),
    };
  }
  if (type === "maintenance") {
    const where: Record<string, unknown> = {};
    if (machineId) where.machineId = machineId;
    if (startDate || endDate) Object.assign(where, dateFilter("serviceDate"));
    const records = await prisma.maintenanceRecord.findMany({ where: where as never, include: { machine: true }, orderBy: { serviceDate: "desc" }, take: 1000 });
    return {
      title: "Maintenance Report",
      headers: ["Date", "Machine", "Registration", "Type", "Meter", "PartsCost", "LaborCost", "TotalCost", "Provider", "Description"],
      rows: records.map((r) => [new Date(r.serviceDate).toLocaleDateString(), r.machine.name, r.machine.registrationNumber, r.serviceType, r.meterReading ?? null, r.partsCost ?? null, r.laborCost ?? null, r.totalCost ?? null, r.serviceProvider ?? "", r.description ?? ""]),
    };
  }
  if (type === "expense") {
    const where: Record<string, unknown> = {};
    if (machineId) where.machineId = machineId;
    if (projectId) where.jobSiteId = projectId;
    if (startDate || endDate) Object.assign(where, dateFilter("date"));
    const expenses = await prisma.expense.findMany({ where: where as never, include: { machine: true, jobSite: true }, orderBy: { date: "desc" }, take: 1000 });
    return {
      title: "Expense Report",
      headers: ["Date", "Category", "Amount", "Machine", "Project", "Description"],
      rows: expenses.map((e) => [new Date(e.date).toLocaleDateString(), e.category, e.amount, e.machine ? `${e.machine.name} (${e.machine.registrationNumber})` : "", e.jobSite ? e.jobSite.name : "", e.description ?? ""]),
    };
  }
  if (type === "operator") {
    const where: Record<string, unknown> = {};
    if (operatorId) where.operatorId = operatorId;
    if (machineId) where.machineId = machineId;
    if (projectId) where.jobSiteId = projectId;
    if (startDate || endDate) Object.assign(where, dateFilter("startTime"));
    const sessions = await prisma.workSession.findMany({ where: where as never, include: { machine: true, operator: true, jobSite: true }, orderBy: { startTime: "desc" }, take: 1000 });
    return {
      title: "Operator Sessions",
      headers: ["Date", "Operator", "Machine", "Registration", "Project", "Opening", "Closing", "Hours", "Status"],
      rows: sessions.map((s) => [new Date(s.startTime).toLocaleDateString(), s.operator.name, s.machine.name, s.machine.registrationNumber, s.jobSite?.name ?? "", s.openingHourMeter, s.closingHourMeter ?? null, s.workingHours ?? null, s.status]),
    };
  }
  if (type === "project") {
    const sites = await prisma.jobSite.findMany({ where: projectId ? { id: projectId } : undefined });
    const rows: Cell[][] = [];
    for (const s of sites) {
      const [workAgg, fuelAgg, expAgg, revAgg] = await Promise.all([
        prisma.workSession.aggregate({ where: { jobSiteId: s.id, status: "COMPLETED" }, _sum: { workingHours: true } }),
        prisma.fuelLog.aggregate({ where: { jobSiteId: s.id }, _sum: { litres: true, totalCost: true } }),
        prisma.expense.aggregate({ where: { jobSiteId: s.id }, _sum: { amount: true } }),
        prisma.revenue.aggregate({ where: { jobSiteId: s.id }, _sum: { amount: true } }),
      ]);
      const hours = workAgg._sum.workingHours ?? 0;
      const litres = fuelAgg._sum.litres ?? 0;
      const fuelCost = fuelAgg._sum.totalCost ?? 0;
      const expCost = expAgg._sum.amount ?? 0;
      const revenue = revAgg._sum.amount ?? 0;
      rows.push([s.name, s.clientName ?? "", hours, litres, fuelCost, expCost, revenue, revenue - (expCost + fuelCost)]);
    }
    return { title: "Project Summary", headers: ["Project", "Client", "Hours", "FuelLitres", "FuelCost", "Expenses", "Revenue", "Profit"], rows };
  }
  if (type === "machine-daily") {
    const where: Record<string, unknown> = { status: "COMPLETED" };
    if (machineId) where.machineId = machineId;
    if (startDate || endDate) Object.assign(where, dateFilter("startTime"));
    const sessions = await prisma.workSession.findMany({ where: where as never, include: { machine: true }, orderBy: { startTime: "desc" }, take: 1000 });
    const byKey = new Map<string, { date: string; machine: string; reg: string; hours: number; sessions: number }>();
    for (const s of sessions) {
      const d = new Date(s.startTime).toLocaleDateString();
      const key = `${d}-${s.machineId}`;
      const cur = byKey.get(key) ?? { date: d, machine: s.machine.name, reg: s.machine.registrationNumber, hours: 0, sessions: 0 };
      cur.hours += s.workingHours ?? 0;
      cur.sessions += 1;
      byKey.set(key, cur);
    }
    return {
      title: "Machine Daily",
      headers: ["Date", "Machine", "Registration", "Hours", "Sessions"],
      rows: [...byKey.values()].map((r) => [r.date, r.machine, r.reg, Number(r.hours.toFixed(2)), r.sessions]),
    };
  }
  return { title: "Unknown", headers: ["Error"], rows: [[`Unknown report type ${type}`]] };
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "OWNER" && user.role !== "ADMIN")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "fuel";
  const format = searchParams.get("format") ?? "csv";
  const safeType = type.replace(/[^a-zA-Z0-9_-]+/g, "") || "report";
  const baseName = `${safeType}-report_${fileStamp()}`;
  const data = await getReportData(type, searchParams.get("machineId"), searchParams.get("operatorId"), searchParams.get("projectId"), searchParams.get("start"), searchParams.get("end"));

  if (format === "xlsx") {
    const buf = await toXlsx(data);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": attachmentHeader(`${baseName}.xlsx`),
      },
    });
  }
  if (format === "pdf") {
    const buf = toPdf(data);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": attachmentHeader(`${baseName}.pdf`),
      },
    });
  }
  return new Response(toCsv(data), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": attachmentHeader(`${baseName}.csv`),
    },
  });
}
