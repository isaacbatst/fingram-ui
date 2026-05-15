import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./format-relative-time";

describe("formatRelativeTime", () => {
  const now = new Date("2026-04-17T14:30:00");

  it('returns "agora" for timestamps within the last minute', () => {
    expect(formatRelativeTime(new Date("2026-04-17T14:29:30"), now)).toBe(
      "agora",
    );
    expect(formatRelativeTime(new Date("2026-04-17T14:30:00"), now)).toBe(
      "agora",
    );
  });

  it('returns "agora" for future timestamps (clock skew)', () => {
    expect(formatRelativeTime(new Date("2026-04-17T14:31:00"), now)).toBe(
      "agora",
    );
  });

  it("returns minutes for sub-hour differences", () => {
    expect(formatRelativeTime(new Date("2026-04-17T14:28:00"), now)).toBe("2m");
    expect(formatRelativeTime(new Date("2026-04-17T13:31:00"), now)).toBe(
      "59m",
    );
  });

  it("returns hours for sub-day differences", () => {
    expect(formatRelativeTime(new Date("2026-04-17T13:30:00"), now)).toBe("1h");
    expect(formatRelativeTime(new Date("2026-04-17T00:30:00"), now)).toBe(
      "14h",
    );
  });

  it('returns "ontem" for the previous calendar day', () => {
    expect(formatRelativeTime(new Date("2026-04-16T20:00:00"), now)).toBe(
      "ontem",
    );
    expect(formatRelativeTime(new Date("2026-04-16T00:01:00"), now)).toBe(
      "ontem",
    );
  });

  it("returns weekday abbreviation for 2–6 days ago", () => {
    expect(formatRelativeTime(new Date("2026-04-15T10:00:00"), now)).toBe(
      "qua",
    );
    expect(formatRelativeTime(new Date("2026-04-12T10:00:00"), now)).toBe(
      "dom",
    );
  });

  it("returns dd/mm for 7+ days ago", () => {
    expect(formatRelativeTime(new Date("2026-04-10T10:00:00"), now)).toBe(
      "10/04",
    );
    expect(formatRelativeTime(new Date("2026-01-05T10:00:00"), now)).toBe(
      "05/01",
    );
  });

  it("accepts ISO string input", () => {
    expect(formatRelativeTime("2026-04-17T14:28:00", now)).toBe("2m");
  });

  it("returns empty string for invalid input", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("");
  });
});
