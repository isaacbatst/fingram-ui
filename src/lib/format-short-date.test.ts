import { describe, it, expect } from "vitest";
import { formatShortDate } from "./format-short-date";

describe("formatShortDate", () => {
  const now = new Date("2026-05-15T14:30:00");

  it('returns "hoje" for the same calendar day', () => {
    expect(formatShortDate(new Date("2026-05-15T00:00:00"), now)).toBe("hoje");
    expect(formatShortDate(new Date("2026-05-15T23:59:00"), now)).toBe("hoje");
  });

  it('returns "ontem" for the previous calendar day', () => {
    expect(formatShortDate(new Date("2026-05-14T20:00:00"), now)).toBe("ontem");
  });

  it("returns dd/mm for dates earlier in the same year", () => {
    expect(formatShortDate(new Date("2026-03-17T10:00:00"), now)).toBe("17/03");
    expect(formatShortDate(new Date("2026-01-05T00:00:00"), now)).toBe("05/01");
  });

  it("returns dd/mm/yy when year differs", () => {
    expect(formatShortDate(new Date("2025-12-31T10:00:00"), now)).toBe(
      "31/12/25",
    );
    expect(formatShortDate(new Date("2027-01-01T10:00:00"), now)).toBe(
      "01/01/27",
    );
  });

  it("accepts ISO string input", () => {
    expect(formatShortDate("2026-03-17T10:00:00", now)).toBe("17/03");
  });

  it("returns empty string for invalid input", () => {
    expect(formatShortDate("not-a-date", now)).toBe("");
  });
});
