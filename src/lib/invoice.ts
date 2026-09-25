import type {
  CardView,
  ImportGroupDTO,
  InvoiceStatus,
  InvoiceView,
  PendingStatement,
} from "@/services/api.interface";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Partes da data como gravadas (meia-noite UTC = o dia), sem conversão de fuso. */
export function dateParts(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("T")[0].split("-").map(Number);
  return { year, month, day };
}

/** "12/08" — o dia de uma compra ou pagamento, como no extrato. */
export function formatDayMonth(iso: string): string {
  const { month, day } = dateParts(iso);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

/** "AAAA-MM-DD" de hoje no fuso do usuário (o dia que ele vê no calendário). */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function monthName(month: number): string {
  return MONTHS[month - 1];
}

/**
 * "Fatura de setembro": a fatura é conhecida pelo mês em que vence. O ano
 * aparece só quando não é o corrente.
 */
export function invoiceTitle(
  invoice: Pick<InvoiceView, "dueDate">,
  now: Date = new Date(),
): string {
  const { year, month } = dateParts(invoice.dueDate);
  const suffix = year === now.getFullYear() ? "" : ` de ${year}`;
  return `Fatura de ${MONTHS[month - 1]}${suffix}`;
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case "open":
      return "Em aberto";
    case "closed":
      return "Fechada";
    case "partial":
      return "Paga em parte";
    case "paid":
      return "Paga";
    case "overpaid":
      return "Paga a mais";
    case "overdue":
      return "Vencida";
  }
}

export type Tone = "accent" | "success" | "warning" | "danger" | "muted";

/**
 * Cor do status. Vencida com o saldo já levado para a fatura seguinte não
 * pede mais nada desta: fica neutra (quem mostra a dívida é a seguinte).
 */
export function invoiceStatusTone(
  invoice: Pick<InvoiceView, "status" | "carriedOut">,
): Tone {
  switch (invoice.status) {
    case "open":
      return "accent";
    case "closed":
    case "partial":
      return "warning";
    case "paid":
      return "success";
    case "overpaid":
      return invoice.carriedOut !== 0 ? "muted" : "warning";
    case "overdue":
      return invoice.carriedOut !== 0 ? "muted" : "danger";
  }
}

type DerivedRow = {
  invoiceRole?: "part" | "remainder" | null;
  amount: number;
  purchaseDate?: string | Date | null;
  purchaseAmount?: number | null;
};

const toIso = (value: string | Date) =>
  typeof value === "string" ? value : value.toISOString();

/** Parte que cobre só um pedaço da compra (a compra foi dividida entre pagamentos). */
export function isSplitPart(tx: DerivedRow): boolean {
  return (
    tx.invoiceRole === "part" &&
    tx.purchaseAmount != null &&
    Math.round(Math.abs(tx.amount) * 100) < Math.round(tx.purchaseAmount * 100)
  );
}

/**
 * Nota curta de uma linha derivada de cartão, para as listas.
 * - parte inteira: "cartão · compra 12/08"
 * - parte dividida: "parte · compra 12/08 · R$ 300,00 de R$ 500,00"
 * - não discriminado e linhas comuns: null (o título já diz o que é)
 */
export function partNote(tx: DerivedRow): string | null {
  if (tx.invoiceRole !== "part" || !tx.purchaseDate) return null;
  const day = formatDayMonth(toIso(tx.purchaseDate));
  if (isSplitPart(tx)) {
    return `parte · compra ${day} · ${formatBRL(Math.abs(tx.amount))} de ${formatBRL(tx.purchaseAmount!)}`;
  }
  return `cartão · compra ${day}`;
}

export type CardNotice =
  | { kind: "overdue"; invoice: InvoiceView }
  | { kind: "notItemized"; invoice: InvoiceView }
  | { kind: "overpaid"; invoice: InvoiceView }
  | { kind: "duplicates"; count: number }
  | { kind: "pendingStatements"; count: number; total: number }
  | { kind: "payable"; amount: number };

/**
 * O que, nos cartões, pede atenção. Em ordem do mais urgente ao informativo:
 * fatura vencida com saldo que não foi para lugar nenhum; pagamento com parte
 * não discriminada (falta o extrato do cartão); fatura paga a mais; possíveis
 * duplicatas; extratos antigos que ainda contam na data da compra; e o total a
 * pagar (compras que entram nos gastos quando pagas).
 */
export function buildCardNotices(input: {
  invoices: InvoiceView[];
  cards: CardView[];
  pendingStatements: PendingStatement[];
  duplicateCount: number;
}): CardNotice[] {
  const notices: CardNotice[] = [];
  const { invoices } = input;

  // Saldo levado para a fatura seguinte (carriedOut ≠ 0) aparece nela como
  // saldo transferido: avisar também aqui seria contar duas vezes.
  for (const invoice of invoices) {
    if (invoice.status === "overdue" && invoice.carriedOut === 0 && invoice.remaining > 0) {
      notices.push({ kind: "overdue", invoice });
    }
  }
  for (const invoice of invoices) {
    if (invoice.notItemized > 0) notices.push({ kind: "notItemized", invoice });
  }
  for (const invoice of invoices) {
    if (invoice.status === "overpaid" && invoice.carriedOut === 0 && invoice.overpaid > 0) {
      notices.push({ kind: "overpaid", invoice });
    }
  }
  if (input.duplicateCount > 0) {
    notices.push({ kind: "duplicates", count: input.duplicateCount });
  }
  if (input.pendingStatements.length > 0) {
    notices.push({
      kind: "pendingStatements",
      count: input.pendingStatements.length,
      total: input.pendingStatements.reduce((sum, s) => sum + s.total, 0),
    });
  }
  const payable = input.cards.reduce((sum, card) => sum + card.payable, 0);
  if (payable > 0) notices.push({ kind: "payable", amount: payable });

  return notices;
}

/** Fatura em aberto do cartão (a do ciclo atual), se houver. */
export function openInvoiceOf(
  card: Pick<CardView, "id" | "currentInvoiceId">,
  invoices: InvoiceView[],
): InvoiceView | undefined {
  const mine = invoices.filter((i) => i.cardId === card.id);
  return (
    mine.find((i) => i.id === card.currentInvoiceId) ??
    mine.find((i) => i.status === "open")
  );
}

/** Um cartão só pode ser excluído sem compras nem pagamentos (senão a API recusa). */
export function canDeleteCard(cardId: string, invoices: InvoiceView[]): boolean {
  return invoices
    .filter((i) => i.cardId === cardId)
    .every((i) => i.purchaseCount === 0 && i.paymentCount === 0);
}

/** "12/08 – 03/09" */
export function formatPeriod(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  return `${formatDayMonth(start)} – ${formatDayMonth(end)}`;
}

/** Data gravada (meia-noite UTC) como Date local do mesmo dia, para o DatePicker. */
export function isoToLocalDate(iso: string): Date {
  const { year, month, day } = dateParts(iso);
  return new Date(year, month - 1, day);
}

/** Date local (do DatePicker) como "AAAA-MM-DD", o formato que a API recebe. */
export function localDateToKey(date: Date): string {
  return todayKey(date);
}

/** Reconhece a recusa por pagamento parecido já registrado (a API aceita repetir com allowDuplicate). */
export function isDuplicatePaymentError(message: string): boolean {
  return /já existe um pagamento de mesmo valor/i.test(message);
}

export type InvoicePaymentTarget = { cardId?: string; invoiceId?: string };

/**
 * O que confirmar sem o usuário escolher nada: a sugestão do servidor. Com
 * mais de um débito no grupo, cada um vai para a fatura da sua data (só o
 * cartão é fixado); com um só, a fatura sugerida (se já existe).
 */
export function suggestedTarget(group: Pick<ImportGroupDTO, "count" | "suggestedInvoicePayment">): InvoicePaymentTarget {
  const suggestion = group.suggestedInvoicePayment;
  if (!suggestion) return {};
  if (group.count === 1 && suggestion.invoiceId) {
    return { cardId: suggestion.cardId, invoiceId: suggestion.invoiceId };
  }
  return { cardId: suggestion.cardId };
}

