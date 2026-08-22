import { z } from "zod";

export const maintenanceTypeEnum = z.enum(["SCHEDULED","UNSCHEDULED","REPAIR"]);

export const maintenanceSchema = z.object({
  machineId: z.string().min(1,"Machine required"),
  serviceType: maintenanceTypeEnum.default("SCHEDULED"),
  description: z.string().max(300).optional().or(z.literal("")),
  meterReading: z.coerce.number().min(0).optional(),
  serviceDate: z.string().optional().or(z.literal("")),
  nextServiceHours: z.coerce.number().min(0).optional(),
  nextServiceDate: z.string().optional().or(z.literal("")),
  partsCost: z.coerce.number().min(0).optional(),
  laborCost: z.coerce.number().min(0).optional(),
  serviceProvider: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
