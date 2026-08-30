import type { BudgetSummaryData } from "@/hooks/useBudgetSummary";
import type { Category } from "@/hooks/useCategories";
import type { SummaryData } from "@/hooks/useSummary";
import type { TransactionsParams } from "@/hooks/useTransactions";
import type { BudgetStartDaySchedule } from "@/lib/budget-period";
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
  planId?: string;
  scheduledMovement: {
    month: number;
    amount: number;
    label: string;
  };
  divergencePercent: number;
  divergenceAmount: number;
  actual?: number;
}

export type ReconcileAction =
  | 'extraAmortization'
  | 'additionalCost'
  | 'updateMonthlyAmount'
  | 'discount'
  | 'pendingPayment';

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

export interface BudgetStartDayConfigResponse {
  defaultDay: number;
  overrides: BudgetStartDaySchedule['overrides'];
  error?: string;
}

export interface SetBudgetStartDayConfigResponse {
  defaultDay?: number;
  overrides?: BudgetStartDaySchedule['overrides'];
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
  getBudgetStartDayConfig(): Promise<BudgetStartDayConfigResponse>;
  setBudgetStartDayConfig(
    config: BudgetStartDaySchedule,
  ): Promise<SetBudgetStartDayConfigResponse>;

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

  // Import de extrato (OFX)
  uploadImport(request: UploadImportRequest): Promise<UploadImportResponse>;
  getImportReview(batchId: string, params?: ImportReviewParams): Promise<ImportReviewData>;
  getImportBatches(): Promise<{ batches: ImportBatchListItem[] }>;
  getImportGroups(batchId: string): Promise<{ groups: ImportGroupDTO[] }>;
  closeImportBatch(batchId: string): Promise<{ error?: string }>;
  categorizeImportEntries(
    entryIds: string[],
    categoryId: string | null,
  ): Promise<{ updated?: number; error?: string }>;
  editImportEntry(request: EditImportEntryRequest): Promise<{ entry?: ImportEntryDTO; error?: string }>;
  dismissImportEntry(entryId: string): Promise<{ entry?: ImportEntryDTO; error?: string }>;
  confirmImportEntries(entryIds: string[]): Promise<ConfirmImportResponse>;
  confirmImportBatch(batchId: string): Promise<ConfirmImportResponse>;
}

export type ImportEntryStatus = "pending" | "confirmed" | "dismissed";
export type ImportSuggestionSource = "history" | "ai" | "none";

export interface ImportBatchDTO {
  id: string;
  accountKey: string;
  accountLabel: string | null;
  boxId: string | null;
  kind: "bank" | "creditcard";
  currency: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  ledgerBalance: number | null;
  fileName: string | null;
  status: "reviewing" | "done";
  /** Lançamentos do arquivo que esta conta já tinha visto. */
  duplicateCount: number;
  /** Corte opcional escolhido no upload. Null = arquivo inteiro. */
  fromDate: string | null;
  /** Lançamentos descartados por serem anteriores ao corte. */
  outOfRangeCount: number;
  createdAt: string;
}

export interface ImportEntryDTO {
  id: string;
  batchId: string;
  fitId: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  categoryId: string | null;
  boxId: string | null;
  suggestedCategoryId: string | null;
  suggestionSource: ImportSuggestionSource;
  status: ImportEntryStatus;
  transactionId: string | null;
  /** Texto original do banco, preservado mesmo depois de editar a descrição. */
  rawDescription: string | null;
  rawAmount: number;
  rawDate: string;
}

/** Um import da lista, com quantos lançamentos ainda esperam decisão. */
export interface ImportBatchListItem extends ImportBatchDTO {
  pendingCount: number;
}

/** Lançamentos pendentes de um mesmo estabelecimento — a unidade de decisão. */
export interface ImportGroupDTO {
  key: string;
  description: string;
  type: "income" | "expense";
  count: number;
  totalAmount: number;
  firstDate: string;
  lastDate: string;
  entryIds: string[];
}

export interface UploadImportRequest {
  contentBase64: string;
  fileName?: string;
  boxId?: string;
  /** Data inicial opcional, no formato YYYY-MM-DD. */
  fromDate?: string;
}

export interface UploadImportResponse {
  batches?: ImportBatchDTO[];
  error?: string;
}

export interface ImportReviewParams {
  status?: ImportEntryStatus;
  page?: number;
  pageSize?: number;
}

export interface ImportReviewData {
  batch: ImportBatchDTO;
  counts: Record<ImportEntryStatus, number>;
  duplicateCount: number;
  outOfRangeCount: number;
  entries: Paginated<ImportEntryDTO>;
}

export interface EditImportEntryRequest {
  entryId: string;
  date?: string;
  amount?: number;
  type?: "income" | "expense";
  description?: string;
  categoryId?: string | null;
  boxId?: string | null;
}

export interface ConfirmImportResponse {
  confirmed?: number;
  skipped?: string[];
  error?: string;
}
