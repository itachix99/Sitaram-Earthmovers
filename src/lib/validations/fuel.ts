import { z } from "zod";

export const fuelSchema = z.object({
  machineId: z.string().min(1,"Machine required"),
  litres: z.coerce.number().positive("Litres must be > 0"),
  costPerLitre: z.coerce.number().min(0).optional(),
  meterReading: z.coerce.number().min(0).optional(),
  fuelStation: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
  date: z.string().optional().or(z.literal("")),
  jobSiteId: z.string().optional().or(z.literal("")),
});

export type FuelInput = z.infer<typeof fuelSchema>;
