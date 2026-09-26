export interface TransactionDTO {
  id: string;
  code: string;
  description?: string;
  amount: number;
  isCommitted: boolean;
  createdAt: Date;
  date: Date;
  type: 'expense' | 'income';
  vaultId: string;
  boxId: string;
  transferId: string | null;
  transferToBoxId: string | null;
  allocationId?: string | null;
  /** Fatura da compra (parte) ou do pagamento (não discriminado). */
  invoiceId?: string | null;
  /**
   * Linha derivada de cartão, mantida pelo servidor — não se edita nem exclui.
   * `part`: parte de uma compra paga por um pagamento, na data dele.
   * `remainder`: o que um pagamento pagou além das compras conhecidas.
   */
  invoiceRole?: 'part' | 'remainder' | null;
  /** (part) Data em que a compra foi feita. `date` é a data do pagamento. */
  purchaseDate?: string | null;
  /** (part) A compra — é ela que se edita ou exclui. */
  purchaseId?: string | null;
  /** (part) Valor total da compra. `amount < purchaseAmount` ⇒ compra dividida. */
  purchaseAmount?: number | null;
  /** (part/remainder) Pagamento que fez a linha contar. */
  paymentId?: string | null;
  category: {
    id: string;
    name: string;
    code: string;
    description?: string;
  } | null;
}
