import { describe, expect, it } from "vitest";
import type { CardView, InvoiceView, PendingStatement } from "@/services/api.interface";
import {
  buildCardNotices,
  canDeleteCard,
  formatDayMonth,
  invoiceStatusTone,
  invoiceTitle,
  isDuplicatePaymentError,
  isSplitPart,
  isoToLocalDate,
  localDateToKey,
  openInvoiceOf,
  partNote,
  suggestedTarget,
} from "./invoice";

const invoice = (overrides: Partial<InvoiceView>): InvoiceView => ({
  id: "i1",
  cardId: "c1",
  cardName: "Nubank",
  periodStart: "2026-08-04T00:00:00.000Z",
  closingDate: "2026-09-03T00:00:00.000Z",
  dueDate: "2026-09-10T00:00:00.000Z",
  closedManually: false,
  purchasesTotal: 3200,
  carriedIn: 0,
  total: 3200,
  paid: 3200,
  remaining: 0,
  overpaid: 0,
  carriedOut: 0,
  status: "paid",
  unpaidPurchases: 0,
  notItemized: 0,
  purchaseCount: 3,
  paymentCount: 2,
  statements: [],
  ...overrides,
});

const card = (overrides: Partial<CardView>): CardView => ({
  id: "c1",
  name: "Nubank",
  closingDay: 3,
  dueDay: 10,
  boxId: "b1",
  accountKey: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  payable: 0,
  currentInvoiceId: null,
  ...overrides,
});

const statement = (overrides: Partial<PendingStatement>): PendingStatement => ({
  batchId: "s1",
  accountLabel: "Cartão 5c9e",
  accountKey: ":5c9e:",
  periodStart: "2026-06-04T00:00:00.000Z",
  periodEnd: "2026-07-03T00:00:00.000Z",
  purchaseCount: 4,
  total: 800,
  cardId: null,
  ...overrides,
});

// toLocaleString("pt-BR") separa "R$" do valor com espaço não separável.
const brl = (text: string) => text.replace(/R\$ /g, "R$\u00a0");

describe("formatDayMonth", () => {
  it("should use the stored day, without shifting by the local time zone", () => {
    expect(formatDayMonth("2026-08-12T00:00:00.000Z")).toBe("12/08");
    expect(formatDayMonth("2026-08-12T03:00:00.000Z")).toBe("12/08");
  });
});

describe("invoiceTitle", () => {
  const now = new Date(2026, 8, 25);

  it("should name the invoice by the month it is due", () => {
    expect(invoiceTitle(invoice({}), now)).toBe("Fatura de setembro");
    expect(invoiceTitle(invoice({ dueDate: "2026-03-10T00:00:00.000Z" }), now)).toBe(
      "Fatura de março",
    );
  });

  it("should add the year when it is not the current one", () => {
    expect(invoiceTitle(invoice({ dueDate: "2025-12-10T00:00:00.000Z" }), now)).toBe(
      "Fatura de dezembro de 2025",
    );
  });
});

describe("invoiceStatusTone", () => {
  it("should flag an overdue invoice whose balance went nowhere", () => {
    expect(invoiceStatusTone({ status: "overdue", carriedOut: 0 })).toBe("danger");
  });

  it("should stay neutral when the balance moved to the next invoice", () => {
    expect(invoiceStatusTone({ status: "overdue", carriedOut: 500 })).toBe("muted");
    expect(invoiceStatusTone({ status: "overpaid", carriedOut: -50 })).toBe("muted");
  });

  it("should use the accent for the open invoice and success when paid", () => {
    expect(invoiceStatusTone({ status: "open", carriedOut: 0 })).toBe("accent");
    expect(invoiceStatusTone({ status: "paid", carriedOut: 0 })).toBe("success");
  });
});

describe("partNote / isSplitPart", () => {
  it("should describe a part that covers the whole purchase", () => {
    const tx = {
      invoiceRole: "part" as const,
      amount: 700,
      purchaseDate: "2026-08-05T00:00:00.000Z",
      purchaseAmount: 700,
    };
    expect(isSplitPart(tx)).toBe(false);
    expect(partNote(tx)).toBe("cartão · compra 05/08");
  });

  it("should show the share of a purchase split across payments", () => {
    const tx = {
      invoiceRole: "part" as const,
      amount: 300,
      purchaseDate: "2026-08-12T00:00:00.000Z",
      purchaseAmount: 500,
    };
    expect(isSplitPart(tx)).toBe(true);
    expect(partNote(tx)).toBe(brl("parte · compra 12/08 · R$ 300,00 de R$ 500,00"));
  });

  it("should compare in cents, not floats", () => {
    expect(
      isSplitPart({ invoiceRole: "part", amount: 0.1 + 0.2, purchaseAmount: 0.3 }),
    ).toBe(false);
  });

  it("should leave the remainder and ordinary rows alone", () => {
    expect(partNote({ invoiceRole: "remainder", amount: 100 })).toBeNull();
    expect(partNote({ invoiceRole: null, amount: 100 })).toBeNull();
    expect(isSplitPart({ invoiceRole: "remainder", amount: 1, purchaseAmount: 5 })).toBe(false);
  });
});

describe("buildCardNotices", () => {
  const base = { invoices: [], cards: [], pendingStatements: [], duplicateCount: 0 };

  it("should be empty when nothing needs attention", () => {
    expect(buildCardNotices({ ...base, invoices: [invoice({})], cards: [card({})] })).toEqual([]);
  });

  it("should list, from urgent to informative, what needs attention", () => {
    const overdue = invoice({ id: "od", status: "overdue", remaining: 400, paid: 2800 });
    const notItemized = invoice({ id: "ni", notItemized: 1200 });
    const overpaid = invoice({ id: "op", status: "overpaid", overpaid: 50 });
    const notices = buildCardNotices({
      invoices: [notItemized, overpaid, overdue],
      cards: [card({ payable: 900 }), card({ id: "c2", payable: 100 })],
      pendingStatements: [statement({}), statement({ batchId: "s2", total: 200 })],
      duplicateCount: 2,
    });
    expect(notices.map((n) => n.kind)).toEqual([
      "overdue",
      "notItemized",
      "overpaid",
      "duplicates",
      "pendingStatements",
      "payable",
    ]);
    expect(notices.find((n) => n.kind === "payable")).toEqual({ kind: "payable", amount: 1000 });
    expect(notices.find((n) => n.kind === "pendingStatements")).toEqual({
      kind: "pendingStatements",
      count: 2,
      total: 1000,
    });
  });

  it("should not repeat an excess that already shows as not itemized", () => {
    const notices = buildCardNotices({
      ...base,
      invoices: [invoice({ status: "overpaid", overpaid: 850, notItemized: 850 })],
    });
    expect(notices.map((n) => n.kind)).toEqual(["notItemized"]);
  });

  it("should not warn about a balance already carried to the next invoice", () => {
    const notices = buildCardNotices({
      ...base,
      invoices: [
        invoice({ id: "old", status: "overdue", remaining: 400, carriedOut: 400 }),
        invoice({ id: "credit", status: "overpaid", overpaid: 50, carriedOut: -50 }),
      ],
    });
    expect(notices).toEqual([]);
  });
});

describe("openInvoiceOf", () => {
  it("should prefer the card's current invoice, then any open one", () => {
    const list = [
      invoice({ id: "a", status: "open" }),
      invoice({ id: "b", status: "open" }),
      invoice({ id: "x", cardId: "other", status: "open" }),
    ];
    expect(openInvoiceOf(card({ currentInvoiceId: "b" }), list)?.id).toBe("b");
    expect(openInvoiceOf(card({ currentInvoiceId: null }), list)?.id).toBe("a");
    expect(openInvoiceOf(card({ id: "none" }), list)).toBeUndefined();
  });
});

describe("canDeleteCard", () => {
  it("should allow only a card without purchases or payments", () => {
    const empty = invoice({ purchaseCount: 0, paymentCount: 0 });
    expect(canDeleteCard("c1", [])).toBe(true);
    expect(canDeleteCard("c1", [empty])).toBe(true);
    expect(canDeleteCard("c1", [empty, invoice({ paymentCount: 1, purchaseCount: 0 })])).toBe(
      false,
    );
    expect(canDeleteCard("c2", [invoice({})])).toBe(true);
  });
});

describe("suggestedTarget", () => {
  const suggestion = {
    cardId: "c1",
    cardName: "Nubank",
    invoiceId: "i1",
    closingDate: "2026-09-03T00:00:00.000Z",
    dueDate: "2026-09-10T00:00:00.000Z",
  };

  it("should pin the suggested invoice for a single debit", () => {
    expect(suggestedTarget({ count: 1, suggestedInvoicePayment: suggestion })).toEqual({
      cardId: "c1",
      invoiceId: "i1",
    });
  });

  it("should fix only the card when several debits may belong to different invoices", () => {
    expect(suggestedTarget({ count: 2, suggestedInvoicePayment: suggestion })).toEqual({
      cardId: "c1",
    });
  });

  it("should let the server create the invoice when it does not exist yet", () => {
    expect(
      suggestedTarget({ count: 1, suggestedInvoicePayment: { ...suggestion, invoiceId: null } }),
    ).toEqual({ cardId: "c1" });
  });

  it("should send nothing when there is no card (the server creates one)", () => {
    expect(suggestedTarget({ count: 1, suggestedInvoicePayment: null })).toEqual({});
  });
});

describe("isoToLocalDate / localDateToKey", () => {
  it("should round-trip the stored day through a local date", () => {
    const local = isoToLocalDate("2026-09-10T00:00:00.000Z");
    expect(local.getDate()).toBe(10);
    expect(local.getMonth()).toBe(8);
    expect(localDateToKey(local)).toBe("2026-09-10");
  });
});

describe("isDuplicatePaymentError", () => {
  it("should recognize the API refusal for a similar payment", () => {
    expect(
      isDuplicatePaymentError(
        "Já existe um pagamento de mesmo valor em 2026-09-10 (id x). Se for mesmo outro pagamento, envie allowDuplicate: true.",
      ),
    ).toBe(true);
    expect(isDuplicatePaymentError("Fatura não encontrada")).toBe(false);
  });
});
