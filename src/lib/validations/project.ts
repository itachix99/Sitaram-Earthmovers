import { z } from "zod";

export const jobSiteStatusEnum = z.enum(["ACTIVE","COMPLETED","ON_HOLD"]);
export const billingTypeEnum = z.enum(["HOURLY","DAILY","FIXED","QUANTITY"]);

export const projectSchema = z.object({
  name: z.string().min(2,"Name required").max(100),
  clientName: z.string().max(80).optional().or(z.literal("")),
  clientPhone: z.string().max(15).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  startDate: z.string().optional().or(z.literal("")),
  expectedEndDate: z.string().optional().or(z.literal("")),
  status: jobSiteStatusEnum.default("ACTIVE"),
  billingType: billingTypeEnum.default("HOURLY"),
  rate: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const assignmentSchema = z.object({
  machineId: z.string().min(1,"Machine required"),
  operatorId: z.string().min(1,"Operator required"),
  jobSiteId: z.string().min(1,"Site required"),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
