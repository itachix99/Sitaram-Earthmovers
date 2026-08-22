import { z } from "zod";

export const salaryTypeEnum = z.enum(["MONTHLY","DAILY","HOURLY"]);
export const userStatusEnum = z.enum(["ACTIVE","INACTIVE"]);

export const operatorCreateSchema = z.object({
  name: z.string().min(2,"Name required").max(80),
  phone: z.string().min(10,"Phone required").max(15).transform(v=>v.trim()),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(6,"Password ≥6 chars"),
  licenseNumber: z.string().max(30).optional().or(z.literal("")),
  licenseExpiry: z.string().optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  salaryType: salaryTypeEnum.default("MONTHLY"),
  salaryAmount: z.coerce.number().min(0).optional(),
  status: userStatusEnum.default("ACTIVE"),
});

export const operatorUpdateSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(10).max(15).transform(v=>v.trim()),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(6).optional().or(z.literal("")),
  licenseNumber: z.string().max(30).optional().or(z.literal("")),
  licenseExpiry: z.string().optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  salaryType: salaryTypeEnum.default("MONTHLY"),
  salaryAmount: z.coerce.number().min(0).optional(),
  status: userStatusEnum.default("ACTIVE"),
});

export type OperatorCreateInput = z.infer<typeof operatorCreateSchema>;
export type OperatorUpdateInput = z.infer<typeof operatorUpdateSchema>;
