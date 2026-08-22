import { z } from "zod";

export const machineTypeEnum = z.enum(["JCB","EXCAVATOR","BACKHOE_LOADER","BULLDOZER","LOADER","TIPPER","DUMP_TRUCK","CRANE","TRACTOR","OTHER"]);
export const machineStatusEnum = z.enum(["ACTIVE","WORKING","IDLE","UNDER_MAINTENANCE","BROKEN_DOWN","RETIRED"]);

export const machineSchema = z.object({
  name: z.string().min(2, "Name required").max(80),
  registrationNumber: z.string().min(4, "Registration required").max(20).transform(v=>v.trim().toUpperCase()),
  machineType: machineTypeEnum,
  manufacturer: z.string().max(50).optional().or(z.literal("")),
  model: z.string().max(50).optional().or(z.literal("")),
  manufacturingYear: z.coerce.number().int().min(1970).max(new Date().getFullYear()+1).optional(),
  purchaseDate: z.string().optional().or(z.literal("")),
  purchasePrice: z.coerce.number().min(0).optional(),
  currentHourMeter: z.coerce.number().min(0, "Meter must be ≥ 0"),
  expectedFuelEfficiency: z.coerce.number().min(0).optional(),
  serviceIntervalHours: z.coerce.number().int().min(50).max(2000).optional(),
  status: machineStatusEnum.default("ACTIVE"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type MachineInput = z.infer<typeof machineSchema>;
