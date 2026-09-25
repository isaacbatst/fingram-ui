import type { TransactionDTO } from "@/utils/transaction.dto,";
import { formatDayMonth } from "@/lib/invoice";

export const OPACITY_FLOOR = 0.5;
export const OPACITY_DECAY = 0.12;

export const getRowOpacity = (idx: number): number =>
  Math.max(OPACITY_FLOOR, 1 - idx * OPACITY_DECAY);

export const formatAmount = (amount: number): string =>
  Math.abs(amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export type RowVisual = {
  color: string;
  sign: string;
  label: string;
  isTransfer: boolean;
  /** O que a fatura de cartão ainda não detalhou — valor real, sem categoria. */
  isInvoiceRemainder: boolean;
  /** "compra 12/08": a compra conta na data de pagamento da fatura. */
  purchaseNote: string | null;
};

export function getRowVisual(tx: TransactionDTO): RowVisual {
  const isTransfer = tx.transferId != null;
  if (isTransfer) {
    return {
      color: "var(--color-info)",
      sign: "",
      label: "Transferência",
      isTransfer: true,
      isInvoiceRemainder: false,
      purchaseNote: null,
    };
  }
  const isIncome = tx.type === "income";
  return {
    color: isIncome ? "var(--color-success)" : "var(--color-danger)",
    sign: isIncome ? "+" : "−",
    label: tx.description || "(Sem descrição)",
    isTransfer: false,
    isInvoiceRemainder: tx.invoiceRole === "remainder",
    purchaseNote:
      tx.invoiceRole === "purchase" && tx.purchaseDate
        ? `compra ${formatDayMonth(tx.purchaseDate)}`
        : null,
  };
}
