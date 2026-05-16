import type { TransactionDTO } from "@/utils/transaction.dto,";

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
};

export function getRowVisual(tx: TransactionDTO): RowVisual {
  const isTransfer = tx.transferId != null;
  if (isTransfer) {
    return {
      color: "var(--color-info)",
      sign: "",
      label: "Transferência",
      isTransfer: true,
    };
  }
  const isIncome = tx.type === "income";
  return {
    color: isIncome ? "var(--color-success)" : "var(--color-danger)",
    sign: isIncome ? "+" : "−",
    label: tx.description || "(Sem descrição)",
    isTransfer: false,
  };
}
