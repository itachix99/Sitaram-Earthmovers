import { describe, it, expect } from "vitest";

function sanitizeCell(v: unknown): string {
  const s = String(v ?? "");
  if (/^[\s]*[=+\-@]/.test(s)) return '\u0027' + s;
  return s;
}

describe("sanitizeCell", () => {
  it("prefixes formula injection", () => {
    expect(sanitizeCell("=SUM(A1:A10)")).toBe("\u0027=SUM(A1:A10)");
    expect(sanitizeCell("+2+3")).toBe("\u0027+2+3");
    expect(sanitizeCell("-2-3")).toBe("\u0027-2-3");
    expect(sanitizeCell("@evil")).toBe("\u0027@evil");
  });
  it("leaves normal text", () => {
    expect(sanitizeCell("hello")).toBe("hello");
    expect(sanitizeCell("  hello")).toBe("  hello");
  });
});
