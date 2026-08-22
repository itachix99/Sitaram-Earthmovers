import { z } from "zod";

export const paymentStatusEnum = z.enum(["PENDING","PARTIAL","PAID","OVERDUE"]);

export const revenueSchema = z.object({
  invoiceNumber: z.string().min(2,"Invoice required").max(30),
  jobSiteId: z.string().optional().or(z.literal("")),
  machineId: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount > 0"),
  amountReceived: z.coerce.number().min(0).optional(),
  paymentStatus: paymentStatusEnum.default("PENDING"),
  billingStart: z.string().optional().or(z.literal("")),
  billingEnd: z.string().optional().or(z.literal("")),
  clientName: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const received = data.amountReceived ?? 0;
  if (received > data.amount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amountReceived"], message: "Amount received cannot exceed invoice amount" });
  }
  if (data.paymentStatus === "PAID" && received !== data.amount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amountReceived"], message: "PAID requires amountReceived = amount" });
  }
  if (data.paymentStatus === "PENDING" && received !== 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amountReceived"], message: "PENDING should have 0 received (use PARTIAL for partial payment)" });
  }
  if (data.paymentStatus === "PARTIAL" && (received <= 0 || received >= data.amount)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amountReceived"], message: "PARTIAL requires 0 < received < amount" });
  }
  const start = data.billingStart ? new Date(data.billingStart as string) : null;
  const end = data.billingEnd ? new Date(data.billingEnd as string) : null;
  if (start && Number.isNaN(start.getTime())) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["billingStart"], message: "Invalid billing start date (YYYY-MM-DD)" });
  if (end && Number.isNaN(end.getTime())) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["billingEnd"], message: "Invalid billing end date (YYYY-MM-DD)" });
  if (start && end && start > end) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["billingEnd"], message: "Billing end must be ≥ start" });
});

export type RevenueInput = z.infer<typeof revenueSchema>;