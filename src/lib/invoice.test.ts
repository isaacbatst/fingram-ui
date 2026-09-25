import { describe, expect, it } from "vitest";
import type { InvoiceDTO } from "@/services/api.interface";
import { formatDayMonth, invoiceTitle, invoicesNeedingAttention } from "./invoice";

const invoice = (overrides: Partial<InvoiceDTO>): InvoiceDTO => ({
  id: "i1",
  amount: 3200,
  paymentDate: "2026-09-10T03:00:00.000Z",
  boxId: "b1",
  cardLabel: null,
  createdAt: "2026-09-24T00:00:00.000Z",
  itemized: 0,
  remainder: 3200,
  excess: 0,
  purchaseCount: 0,
  status: "awaiting",
  statements: [],
  ...overrides,
});

describe("formatDayMonth", () => {
  it("should use the stored day, without shifting by the local time zone", () => {
    expect(formatDayMonth("2026-08-12T00:00:00.000Z")).toBe("12/08");
    expect(formatDayMonth("2026-08-12T03:00:00.000Z")).toBe("12/08");
  });
});

describe("invoiceTitle", () => {
  it("should name the invoice by the month it was paid", () => {
    expect(invoiceTitle(invoice({}))).toBe("Fatura de setembro");
    expect(invoiceTitle(invoice({ paymentDate: "2026-03-01T00:00:00.000Z" }))).toBe(
      "Fatura de março",
    );
  });
});

describe("invoicesNeedingAttention", () => {
  const september = {
    startDate: new Date(Date.UTC(2026, 8, 1)),
    endDate: new Date(Date.UTC(2026, 8, 30, 23, 59, 59, 999)),
  };

  it("should keep invoices with an undetailed part or an excess", () => {
    const list = [
      invoice({ id: "a" }),
      invoice({ id: "b", remainder: 0, status: "detailed" }),
      invoice({ id: "c", remainder: 0, excess: 50, status: "exceeded" }),
    ];
    expect(invoicesNeedingAttention(list).map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("should keep only invoices paid within the period", () => {
    const list = [
      invoice({ id: "set" }),
      invoice({ id: "ago", paymentDate: "2026-08-10T03:00:00.000Z" }),
    ];
    expect(invoicesNeedingAttention(list, september).map((i) => i.id)).toEqual(["set"]);
  });
});
