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
});

export type RevenueInput = z.infer<typeof revenueSchema>;
