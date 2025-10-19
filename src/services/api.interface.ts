import type { BudgetSummaryData } from "@/hooks/useBudgetSummary";
import type { SummaryData } from "@/hooks/useSummary";
import type { Category } from "@/hooks/useCategories";
import type { Paginated } from "@/utils/paginated";
import type { TransactionDTO } from "@/utils/transaction.dto,";
import type { TransactionsParams } from "@/hooks/useTransactions";

export interface Budget {
  categoryId: string;
  amount: number;
}

export interface SetBudgetsResponse {
  error?: string;
}

export interface EditTransactionRequest {
  transactionCode: string;
  newAmount?: number;
  newDate?: string;
  newCategory?: string;
  newDescription?: string;
  newType?: 'income' | 'expense';
}

export interface EditTransactionResponse {
  error?: string;
}

export interface CreateTransactionRequest {
  amount: number;
  description?: string;
  categoryId?: string;
  date?: string; // ISO date string
  type: 'income' | 'expense';
}

export interface CreateTransactionResponse {
  transaction?: TransactionDTO;
  vault?: any;
  error?: string;
}

export interface ApiService {
  // Auth
  isAuthenticated(): boolean;
  getSessionToken(): string | null;
  
  // Summary
  getSummary(): Promise<SummaryData>;
  getBudgetSummary(year?: number, month?: number): Promise<BudgetSummaryData>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  
  // Transactions
  getTransactions(params?: TransactionsParams): Promise<Paginated<TransactionDTO>>;
  createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse>;
  editTransaction(request: EditTransactionRequest): Promise<EditTransactionResponse>;
  
  // Budgets
  setBudgets(budgets: Budget[]): Promise<SetBudgetsResponse>;
}
