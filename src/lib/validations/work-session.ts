import { z } from "zod";

export const startWorkSchema = z.object({
  machineId: z.string().min(1,"Machine required"),
  jobSiteId: z.string().optional().or(z.literal("")),
  openingHourMeter: z.coerce.number().min(0,"Opening meter ≥ 0"),
  notes: z.string().max(500).optional().or(z.literal("")),
  startPhotoUrl: z.string().optional().or(z.literal("")),
});

export const endWorkSchema = z.object({
  sessionId: z.string().min(1),
  closingHourMeter: z.coerce.number().min(0,"Closing meter ≥ 0"),
  fuelUsed: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
  endPhotoUrl: z.string().optional().or(z.literal("")),
});

export type StartWorkInput = z.infer<typeof startWorkSchema>;
export type EndWorkInput = z.infer<typeof endWorkSchema>;
