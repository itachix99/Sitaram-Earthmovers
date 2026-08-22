import { describe, it, expect } from "vitest";
import { revenueSchema } from "@/lib/validations/revenue";
import { fuelSchema } from "@/lib/validations/fuel";

describe("revenueSchema", () => {
  it("rejects amountReceived > amount", () => {
    const res = revenueSchema.safeParse({ invoiceNumber: "INV-1", amount: 1000, amountReceived: 1500, paymentStatus: "PAID" });
    expect(res.success).toBe(false);
  });
  it("requires PAID => received == amount", () => {
    const res = revenueSchema.safeParse({ invoiceNumber: "INV-2", amount: 1000, amountReceived: 500, paymentStatus: "PAID" });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues[0].message).toMatch(/PAID/);
  });
  it("accepts PARTIAL with 0 < received < amount", () => {
    const res = revenueSchema.safeParse({ invoiceNumber: "INV-3", amount: 1000, amountReceived: 400, paymentStatus: "PARTIAL" });
    expect(res.success).toBe(true);
  });
  it("rejects PENDING with non-zero received", () => {
    const res = revenueSchema.safeParse({ invoiceNumber: "INV-4", amount: 1000, amountReceived: 100, paymentStatus: "PENDING" });
    expect(res.success).toBe(false);
  });
  it("validates billing range", () => {
    const res = revenueSchema.safeParse({ invoiceNumber: "INV-5", amount: 1000, billingStart: "2024-02-01", billingEnd: "2024-01-01" });
    expect(res.success).toBe(false);
  });
});

describe("fuelSchema", () => {
  it("rejects negative litres", () => {
    const res = fuelSchema.safeParse({ machineId: "m1", litres: -5 });
    expect(res.success).toBe(false);
  });
  it("accepts valid litres", () => {
    const res = fuelSchema.safeParse({ machineId: "m1", litres: 10 });
    expect(res.success).toBe(true);
  });
});
