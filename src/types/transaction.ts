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
  /** `remainder`: parte da fatura ainda sem detalhe. `purchase`: compra ligada a ela. */
  invoiceRole?: "remainder" | "purchase" | null;
  /** Data da compra, quando ela conta na data de pagamento da fatura. */
  purchaseDate?: string | null;
};
