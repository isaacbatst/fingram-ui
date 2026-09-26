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
  transactionId: string;
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

  // Atividade diária (grid da tela inicial)
  getActivity(weeks?: number): Promise<ActivityData>;

  // Transactions
  getTransactions(params?: TransactionsParams): Promise<Paginated<TransactionDTO>>;
  createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse>;
  editTransaction(request: EditTransactionRequest): Promise<EditTransactionResponse>;

  // Budgets
  setBudgets(budgets: Budget[]): Promise<SetBudgetsResponse>;
  deleteTransaction(transactionId: string): Promise<{
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
  /** Define categoria OU pagamento planejado — exclusivos, como no formulário. */
  categorizeImportEntries(
    entryIds: string[],
    categoryId: string | null,
    allocationId?: string | null,
  ): Promise<{ updated?: number; error?: string }>;
  editImportEntry(request: EditImportEntryRequest): Promise<{ entry?: ImportEntryDTO; error?: string }>;
  dismissImportEntry(entryId: string): Promise<{ entry?: ImportEntryDTO; error?: string }>;
  confirmImportEntries(entryIds: string[]): Promise<ConfirmImportResponse>;
  /** Confirma como transferência entre estratos: cria o par, não uma transação solta. */
  confirmImportTransfer(
    entryIds: string[],
    boxId: string,
  ): Promise<ConfirmImportResponse>;
  /**
   * Confirma despesas pagas com dinheiro de uma Reserva (realização ou saque):
   * lança a despesa vinculada a ela, no estrato da Reserva.
   */
  confirmImportReserveWithdrawal(
    entryIds: string[],
    allocationId: string,
    withdrawalType: "withdrawal" | "realization",
    fromEstrato: boolean,
  ): Promise<ConfirmImportResponse>;
  confirmImportBatch(batchId: string): Promise<ConfirmImportResponse>;
  /**
   * Confirma o débito "pagamento de fatura" da conta corrente como pagamento
   * de fatura. Sem `invoiceId`, a fatura sai da data de cada lançamento no
   * cartão; sem cartão cadastrado, o Duna cria um.
   */
  confirmImportInvoicePayment(
    entryIds: string[],
    target: { cardId?: string; invoiceId?: string },
  ): Promise<ConfirmInvoicePaymentResponse>;
  /** Liga um extrato de cartão a uma fatura (ou desliga, com null). */
  setImportBatchInvoice(
    batchId: string,
    invoiceId: string | null,
  ): Promise<ApiResult<ImportBatchDTO>>;
  /** Marca (ou desmarca) um extrato de cartão como "sem fatura". */
  setImportBatchNoInvoice(
    batchId: string,
    noInvoice: boolean,
  ): Promise<ApiResult<ImportBatchDTO>>;

  // Cartões, faturas e pagamentos
  getCards(): Promise<CardView[]>;
  createCard(request: CardRequest): Promise<ApiResult<CardView>>;
  updateCard(cardId: string, request: Partial<CardRequest>): Promise<ApiResult<CardView>>;
  deleteCard(cardId: string): Promise<ApiResult<{ deleted: true }>>;
  getAvailableBalance(): Promise<AvailableBalanceData>;
  getInvoices(cardId?: string): Promise<InvoicesData>;
  getInvoice(invoiceId: string): Promise<InvoiceDetail>;
  getInvoiceReconcile(invoiceId: string): Promise<InvoiceReconcile>;
  updateInvoice(
    invoiceId: string,
    request: UpdateInvoiceRequest,
  ): Promise<ApiResult<InvoiceView>>;
  /** Fecha antes da data: compras depois de `closingDate` caem na próxima. */
  closeInvoice(invoiceId: string, closingDate: string): Promise<ApiResult<InvoiceView>>;
  addInvoicePayment(request: AddPaymentRequest): Promise<ApiResult<PaymentResult>>;
  updateInvoicePayment(
    paymentId: string,
    request: UpdatePaymentRequest,
  ): Promise<ApiResult<PaymentResult>>;
  deleteInvoicePayment(paymentId: string): Promise<ApiResult<{ deleted: true }>>;
  getDuplicates(invoiceId?: string): Promise<{ pairs: DuplicatePair[] }>;
  /** "Não é duplicata": o par deixa de ser sugerido; os lançamentos ficam. */
  dismissDuplicate(pair: {
    manualTransactionId: string;
    importedTransactionId: string;
  }): Promise<ApiResult<{ dismissed: true }>>;
  previewReprocess(): Promise<ReprocessReport>;
  applyReprocess(): Promise<ApiResult<ReprocessReport>>;

  // MCP (conexões com clientes de IA)
  getMcpConnections(): Promise<McpConnection[]>;
  revokeMcpConnection(clientId: string): Promise<void>;
  getOAuthConsent(request: string): Promise<OAuthConsentDetails>;
  approveOAuthConsent(request: string): Promise<OAuthConsentResult>;
  denyOAuthConsent(request: string): Promise<OAuthConsentResult>;
}

export interface McpConnection {
  clientId: string;
  clientName: string | null;
  connectedAt: string;
  lastUsedAt: string | null;
}

export interface OAuthConsentDetails {
  clientName: string | null;
  clientUri: string | null;
  redirectUri: string;
}

export interface OAuthConsentResult {
  redirectUrl: string;
}

export interface DailyActivity {
  /** Dia em UTC, no formato YYYY-MM-DD. */
  date: string;
  count: number;
  expenseTotal: number;
}

export interface ActivityData {
  startDate: string;
  endDate: string;
  days: DailyActivity[];
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
  /** Fatura (ciclo do cartão) deste extrato de cartão. */
  invoiceId: string | null;
  /** Extrato de cartão marcado "sem fatura": as compras contam na data delas. */
  noInvoice: boolean;
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
  /** Parece quitação de fatura — não é gasto novo, e sim o pagamento dela. */
  looksLikeSettlement: boolean;
  /** Débito de pagamento de fatura na conta corrente: propor "Pagamento de fatura". */
  suggestsInvoice: boolean;
  /**
   * Cartão e fatura que esse pagamento pagaria. `invoiceId` null: a fatura é
   * criada ao confirmar. Objeto null: nenhum cartão cadastrado (o Duna cria um).
   */
  suggestedInvoicePayment: SuggestedInvoicePayment | null;
  /** Pagamento planejado cuja parcela prevista bate com valor e mês do grupo. */
  suggestedAllocation: { allocationId: string; label: string } | null;
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

/** Resultado de uma ação: o dado, ou a mensagem da API pronta para mostrar. */
export type ApiResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

export interface ConfirmInvoicePaymentResponse {
  confirmed?: number;
  skipped?: string[];
  paymentIds?: string[];
  invoiceIds?: string[];
  error?: string;
}

export interface SuggestedInvoicePayment {
  cardId: string;
  cardName: string;
  invoiceId: string | null;
  closingDate: string;
  dueDate: string;
}

export interface CardView {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  /** Estrato pagador: de onde saem os pagamentos. */
  boxId: string;
  /** Conta do OFX que liga extratos a este cartão. */
  accountKey: string | null;
  createdAt: string;
  /** Compras ainda não pagas, de todas as faturas. */
  payable: number;
  /** Fatura em aberto que contém hoje, se existir. */
  currentInvoiceId: string | null;
}

export interface CardRequest {
  name: string;
  closingDay: number;
  dueDay: number;
  boxId?: string;
}

export interface AvailableBalanceData {
  estratos: {
    boxId: string;
    name: string;
    type: BoxType;
    balance: number;
    cardPayable: number;
    available: number;
  }[];
  cards: { cardId: string; name: string; boxId: string; payable: number }[];
  /** Só estratos de gasto. */
  total: { balance: number; cardPayable: number; available: number };
}

export type InvoiceStatus =
  | "open"
  | "closed"
  | "partial"
  | "paid"
  | "overpaid"
  | "overdue";

export interface StatementRef {
  batchId: string;
  accountLabel: string | null;
  fileName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  ledgerBalance: number | null;
}

/** Fatura = ciclo do cartão. O total sai das compras; nunca é digitado. */
export interface InvoiceView {
  id: string;
  cardId: string;
  cardName: string;
  periodStart: string;
  closingDate: string;
  dueDate: string;
  closedManually: boolean;
  /** Compras − estornos. */
  purchasesTotal: number;
  /** Saldo transferido da fatura anterior vencida (negativo = crédito). */
  carriedIn: number;
  /** purchasesTotal + carriedIn: o valor da fatura. */
  total: number;
  paid: number;
  remaining: number;
  overpaid: number;
  /** O que foi para a próxima fatura depois do vencimento. */
  carriedOut: number;
  status: InvoiceStatus;
  /** Compras desta fatura ainda não pagas ("a pagar"). */
  unpaidPurchases: number;
  /** Não discriminado dos pagamentos desta fatura. */
  notItemized: number;
  purchaseCount: number;
  paymentCount: number;
  statements: StatementRef[];
}

/** Extrato de cartão antigo, com compras que ainda contam na data da compra. */
export interface PendingStatement {
  batchId: string;
  accountLabel: string | null;
  accountKey: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  purchaseCount: number;
  total: number;
  cardId: string | null;
}

export interface InvoicesData {
  invoices: InvoiceView[];
  pendingStatements: PendingStatement[];
}

export interface InvoicePurchase {
  id: string;
  date: string;
  description: string;
  amount: number;
  /** income = estorno. */
  type: "expense" | "income";
  categoryId: string | null;
  allocationId: string | null;
  paid: number;
  unpaid: number;
  fromStatement: boolean;
  parts: { transactionId: string; paymentId: string; amount: number; date: string }[];
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  boxId: string;
  imported: boolean;
  importEntryId: string | null;
  notItemized: number;
  notItemizedTransactionId: string | null;
  parts: {
    transactionId: string;
    purchaseId: string;
    purchaseInvoiceId: string;
    amount: number;
  }[];
}

export interface InvoiceDetail {
  invoice: InvoiceView;
  purchases: InvoicePurchase[];
  payments: InvoicePayment[];
}

export interface UpdateInvoiceRequest {
  periodStart?: string;
  closingDate?: string;
  dueDate?: string;
  closed?: boolean;
}

export interface AddPaymentRequest {
  invoiceId?: string;
  cardId?: string;
  amount: number;
  /** AAAA-MM-DD */
  date: string;
  boxId?: string;
  allowDuplicate?: boolean;
}

export interface UpdatePaymentRequest {
  amount?: number;
  date?: string;
  invoiceId?: string;
  boxId?: string;
}

export interface PaymentResult {
  payment: InvoicePayment;
  invoice: InvoiceView;
}

export interface DuplicateRef {
  transactionId: string;
  date: string;
  amount: number;
  description: string;
  categoryId: string | null;
  invoiceId: string | null;
}

/** Transação lançada à mão que parece ser a mesma compra importada do cartão. */
export interface DuplicatePair {
  manual: DuplicateRef;
  imported: DuplicateRef & { entryId: string };
  confidence: "high" | "medium";
  dayDistance: number;
}

export interface InvoiceReconcile {
  invoiceId: string;
  purchasesTotal: number;
  total: number;
  paid: number;
  statements: (StatementRef & {
    statementTotal: number;
    ledgerMatchesTotal: boolean | null;
  })[];
  missing: {
    entryId: string;
    batchId: string;
    date: string;
    amount: number;
    type: "income" | "expense";
    description: string;
    reason: "pending" | "dismissed" | "deleted" | "elsewhere";
    transactionId: string | null;
  }[];
  extra: DuplicateRef[];
  duplicates: DuplicatePair[];
}

export interface ReprocessReport {
  statements: {
    batchId: string;
    accountLabel: string | null;
    cardId: string;
    cardName: string;
    newCard: boolean;
    invoiceId: string;
    closingDate: string;
    purchaseCount: number;
    total: number;
  }[];
  payments: {
    entryId: string;
    date: string;
    amount: number;
    boxId: string;
    cardId: string;
    cardName: string;
    invoiceId: string;
    source: "dismissed" | "expense";
    removedTransactionId: string | null;
  }[];
  skipped: { entryId?: string; batchId?: string; reason: string }[];
  /** Total de gastos do mês de orçamento, só os meses que mudam. */
  months: { year: number; month: number; before: number; after: number }[];
}
