import { z } from "zod";

export const severityEnum = z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]);
export const issueStatusEnum = z.enum(["OPEN","IN_PROGRESS","RESOLVED"]);

export const breakdownSchema = z.object({
  machineId: z.string().min(1,"Machine required"),
  severity: severityEnum.default("MEDIUM"),
  issue: z.string().min(3,"Issue required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
});

export const breakdownUpdateSchema = z.object({
  status: issueStatusEnum,
  resolutionNotes: z.string().max(500).optional().or(z.literal("")),
  severity: severityEnum.optional(),
});

export type BreakdownInput = z.infer<typeof breakdownSchema>;
