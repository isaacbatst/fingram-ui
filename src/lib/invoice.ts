import type { InvoiceDTO } from "@/services/api.interface";

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

/** Partes da data como gravadas (dia do extrato), sem conversão de fuso. */
function dateParts(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("T")[0].split("-").map(Number);
  return { year, month, day };
}

/** "12/08" — o dia de uma compra ou pagamento, como no extrato. */
export function formatDayMonth(iso: string): string {
  const { month, day } = dateParts(iso);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

/** "Fatura de setembro": a fatura é conhecida pelo mês em que foi paga. */
export function invoiceTitle(invoice: Pick<InvoiceDTO, "paymentDate">): string {
  return `Fatura de ${MONTHS[dateParts(invoice.paymentDate).month - 1]}`;
}

/**
 * Faturas que pedem atenção: parte ainda sem detalhe, ou compras além do valor
 * pago. Com `period`, só as pagas dentro dele (o mês que o usuário está vendo).
 */
export function invoicesNeedingAttention(
  invoices: InvoiceDTO[],
  period?: { startDate: Date; endDate: Date },
): InvoiceDTO[] {
  return invoices.filter((invoice) => {
    if (invoice.remainder <= 0 && invoice.excess <= 0) return false;
    if (!period) return true;
    const paid = new Date(invoice.paymentDate).getTime();
    return paid >= period.startDate.getTime() && paid <= period.endDate.getTime();
  });
}
