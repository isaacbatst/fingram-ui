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
  category: {
    id: string;
    name: string;
    code: string;
    description?: string;
  } | null;
}
