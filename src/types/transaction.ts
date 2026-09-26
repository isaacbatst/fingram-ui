export type Transaction = {
  id: string;
  code: string;
  type: "income" | "expense";
  amount: number;
  category:
    | string
    | {
        id: string;
        name: string;
        code: string;
        description?: string;
      };
  categoryCode?: string;
  description: string;
  createdAt: string;
  date: string;
  boxId?: string;
  transferId?: string | null;
  transferToBoxId?: string;
  allocationId?: string | null;
  invoiceId?: string | null;
  /** Linha derivada de cartão: `part` (parte de uma compra) ou `remainder` (não discriminado). */
  invoiceRole?: "part" | "remainder" | null;
  /** (part) Data da compra; `date` é a data do pagamento. */
  purchaseDate?: string | null;
  purchaseId?: string | null;
  purchaseAmount?: number | null;
  paymentId?: string | null;
};
