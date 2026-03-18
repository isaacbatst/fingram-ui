import type { BudgetSummaryData } from "@/hooks/useBudgetSummary";
import type { Category } from "@/hooks/useCategories";
import type { SummaryData } from "@/hooks/useSummary";
import type { TransactionsParams } from "@/hooks/useTransactions";
import type { Paginated } from "@/utils/paginated";
import type { TransactionDTO } from "@/utils/transaction.dto,";

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
  newBoxId?: string;
  newAllocationId?: string;
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
  boxId?: string;
  allocationId?: string;
  withdrawalType?: 'withdrawal' | 'realization';
}

export type BoxType = 'spending' | 'saving';

export interface BoxDTO {
  id: string;
  name: string;
  goalAmount: number | null;
  isDefault: boolean;
  type: BoxType;
  balance: number;
  goalProgress: number | null;
}

export interface CreateBoxRequest {
  name: string;
  goalAmount?: number;
  type?: BoxType;
}

export interface EditBoxRequest {
  boxId: string;
  name?: string;
  goalAmount?: number | null;
  type?: BoxType;
}

export interface CreateTransferRequest {
  fromBoxId: string;
  toBoxId: string;
  amount: number;
  date?: string;
}

export interface EditTransferRequest {
  transferId: string;
  amount?: number;
  date?: string;
  fromBoxId?: string;
  toBoxId?: string;
}

export interface AllocationSuggestion {
  allocationId: string;
  allocationLabel: string;
  scheduledMovement: {
    month: number;
    amount: number;
    label: string;
  };
  divergencePercent: number;
  divergenceAmount: number;
}

export interface CreateTransactionResponse {
  transaction?: TransactionDTO;
  vault?: unknown;
  error?: string;
  suggestion?: AllocationSuggestion | null;
  divergence?: AllocationSuggestion | null;
}

export interface SuggestAllocationResponse {
  suggestion?: AllocationSuggestion | null;
  error?: string;
}

export interface SetBudgetStartDayResponse {
  budgetStartDay?: number;
  error?: string;
}

export interface GetBudgetStartDayResponse {
  budgetStartDay: number;
  error?: string;
}

export interface SuggestCategoryRequest {
  description: string;
  transactionType: 'income' | 'expense';
}

export interface SuggestCategoryResponse {
  categoryId?: string;
  error?: string;
}

export interface BudgetCeilingData {
  ceiling: number | null;
  allocated: number;
  buffer: number | null;
  overBudget: boolean;
}

export interface ApiService {
  // Auth
  isAuthenticated(): boolean;
  getSessionToken(): string | null;

  // Summary
  getSummary(): Promise<SummaryData>;
  getBudgetSummary(year?: number, month?: number): Promise<BudgetSummaryData>;
  getBudgetCeiling(): Promise<BudgetCeilingData>;

  // Categories
  getCategories(): Promise<Category[]>;

  // Transactions
  getTransactions(params?: TransactionsParams): Promise<Paginated<TransactionDTO>>;
  createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse>;
  editTransaction(request: EditTransactionRequest): Promise<EditTransactionResponse>;

  // Budgets
  setBudgets(budgets: Budget[]): Promise<SetBudgetsResponse>;
  deleteTransaction(transactionCode: string): Promise<{
    error?: string;
  }>;

  // Budget Settings
  setBudgetStartDay(day: number): Promise<SetBudgetStartDayResponse>;
  getBudgetStartDay(): Promise<GetBudgetStartDayResponse>;

  // Category Suggestion
  suggestCategory(request: SuggestCategoryRequest): Promise<SuggestCategoryResponse>;

  // Allocation Suggestion
  suggestAllocation(amount: number): Promise<SuggestAllocationResponse>;

  // Boxes
  getBoxes(): Promise<BoxDTO[]>;
  createBox(request: CreateBoxRequest): Promise<{ box?: BoxDTO; error?: string }>;
  editBox(request: EditBoxRequest): Promise<{ error?: string }>;
  deleteBox(boxId: string): Promise<{ error?: string }>;

  // Transfers
  createTransfer(request: CreateTransferRequest): Promise<{ transferId?: string; error?: string }>;
  editTransfer(request: EditTransferRequest): Promise<{ error?: string }>;
  deleteTransfer(transferId: string): Promise<{ error?: string }>;
}
