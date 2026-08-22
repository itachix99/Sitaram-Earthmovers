import { z } from "zod";

export const expenseCategoryEnum = z.enum(["FUEL","MAINTENANCE","REPAIR","OPERATOR_PAYMENT","TRANSPORT","SPARE_PARTS","PERMITS","OTHER"]);

export const expenseSchema = z.object({
  category: expenseCategoryEnum,
  amount: z.coerce.number().positive("Amount must be > 0"),
  machineId: z.string().optional().or(z.literal("")),
  jobSiteId: z.string().optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
  date: z.string().optional().or(z.literal("")),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
