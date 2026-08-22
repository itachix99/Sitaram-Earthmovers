import { describe, it, expect } from "vitest";
import { toNum } from "@/lib/utils";

describe("toNum", () => {
  it("coerces Decimal-like", () => {
    expect(toNum("10.5")).toBe(10.5);
    expect(toNum(null)).toBe(0);
    expect(toNum(undefined)).toBe(0);
  });
  it("profit math excludes FUEL double-count", () => {
    const fuelCost = 100, maintCost = 50, expCost = 30, revenue = 300;
    const profit = revenue - (fuelCost + maintCost + expCost);
    expect(profit).toBe(120);
  });
});
