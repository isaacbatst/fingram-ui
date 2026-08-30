import type { BudgetSummaryData } from "@/hooks/useBudgetSummary";
import type { SummaryData } from "@/hooks/useSummary";
import type { Category } from "@/hooks/useCategories";
import type { BudgetStartDaySchedule } from "@/lib/budget-period";
import type { Paginated } from "@/utils/paginated";
import type { TransactionDTO } from "@/utils/transaction.dto,";
import type { TransactionsParams } from "@/hooks/useTransactions";
import type {
  ApiService,
  Budget,
  BudgetCeilingData,
  BudgetStartDayConfigResponse,
  SetBudgetsResponse,
  EditTransactionRequest,
  EditTransactionResponse,
  CreateTransactionRequest,
  CreateTransactionResponse,
  SetBudgetStartDayConfigResponse,
  SuggestCategoryRequest,
  SuggestCategoryResponse,
  SuggestAllocationResponse,
  BoxDTO,
  CreateBoxRequest,
  EditBoxRequest,
  CreateTransferRequest,
  EditTransferRequest,
  UploadImportRequest,
  UploadImportResponse,
  ImportReviewParams,
  ImportReviewData,
  EditImportEntryRequest,
  ImportEntryDTO,
  ImportGroupDTO,
  ImportBatchListItem,
  ConfirmImportResponse,
} from "./api.interface";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

export class StandaloneApiService implements ApiService {
  static BASE_URL = API_BASE_URL;

  constructor() {
    // No need to store tokens - authentication is handled by HTTP-only cookies
  }

  updateAccessToken() {
    // No-op since we're using cookie-based authentication
  }

  isAuthenticated(): boolean {
    // Authentication status is managed by the AuthContext
    // This method is kept for interface compatibility
    return true;
  }

  getSessionToken(): string | null {
    // No session token needed with cookie-based authentication
    return null;
  }

  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${API_BASE_URL}/vault${endpoint}`;
    
    const defaultOptions: RequestInit = {
      credentials: 'include', // Include cookies for HTTP-only authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
      throw new Error("Token de acesso inválido ou expirado.");
    }
    
    if (!response.ok) {
      throw new Error("Erro ao conectar com o servidor");
    }

    return response;
  }

  async authenticate(accessToken: string): Promise<{ vaultId: string }> {
    const response = await this.makeRequest('/authenticate', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });

    const data = await response.json();
    
    return data;
  }

  async getSummary(): Promise<SummaryData> {
    const response = await this.makeRequest('/summary');
    return response.json();
  }

  async getBudgetSummary(year?: number, month?: number): Promise<BudgetSummaryData> {
    const url = new URL(`${API_BASE_URL}/vault/summary`);
    if (year && month) {
      url.searchParams.append("year", year.toString());
      url.searchParams.append("month", month.toString());
    }

    const response = await this.makeRequest(`/summary?${url.searchParams.toString()}`);
    return response.json();
  }

  async getCategories(): Promise<Category[]> {
    const response = await this.makeRequest('/categories');
    return response.json();
  }

  async getTransactions(params?: TransactionsParams): Promise<Paginated<TransactionDTO>> {
    const url = new URL(`${API_BASE_URL}/vault/transactions`);
    
    if (params?.page) {
      url.searchParams.append("page", params.page.toString());
    }
    if (params?.year && params?.month) {
      url.searchParams.append("year", params.year.toString());
      url.searchParams.append("month", params.month.toString());
    }
    if (params?.categoryId) {
      url.searchParams.append("categoryId", params.categoryId);
    }
    if (params?.description) {
      url.searchParams.append("description", params.description);
    }
    if (params?.boxId) {
      url.searchParams.append("boxId", params.boxId);
    }
    if (params?.allPeriods) {
      url.searchParams.append("allPeriods", "true");
    }

    const response = await this.makeRequest(`/transactions?${url.searchParams.toString()}`);
    return response.json();
  }

  async createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    try {
      const response = await this.makeRequest('/create-transaction', {
        method: "POST",
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);
      return { error: "Erro ao conectar com o servidor" };
    }
  }

  async editTransaction(request: EditTransactionRequest): Promise<EditTransactionResponse> {
    try {
      await this.makeRequest('/edit-transaction', {
        method: "POST",
        body: JSON.stringify(request),
      });

      return {};
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);
      return { error: "Erro ao conectar com o servidor" };
    }
  }

  async setBudgets(budgets: Budget[]): Promise<SetBudgetsResponse> {
    try {
      await this.makeRequest('/set-budgets', {
        method: "POST",
        body: JSON.stringify({ 
          budgets: budgets.map(b => ({
            categoryCode: b.categoryId, // Backend expects categoryCode
            amount: b.amount
          }))
        }),
      });

      return {};
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);
      return { error: "Erro ao conectar com o servidor" };
    }
  }

  async deleteTransaction(transactionCode: string): Promise<{
    error?: string;
  }> {
    try {
      await this.makeRequest('/delete-transaction', {
        method: "POST",
        body: JSON.stringify({ transactionCode }),
      });
      return {};
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);
      return { error: "Erro ao deletar transação" };
    }
  }

  async setBudgetStartDayConfig(
    config: BudgetStartDaySchedule,
  ): Promise<SetBudgetStartDayConfigResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/vault/budget-start-day`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const body = (await response
          .json()
          .catch(() => ({}))) as { message?: string };
        return {
          error:
            body.message ?? "Erro ao definir configuração do dia de início",
        };
      }
      return await response.json();
    } catch (error) {
      console.error("Erro ao definir configuração do dia de início:", error);
      return { error: "Erro ao definir configuração do dia de início" };
    }
  }

  async getBudgetCeiling(): Promise<BudgetCeilingData> {
    const response = await this.makeRequest('/budget-ceiling');
    return response.json();
  }

  async getBudgetStartDayConfig(): Promise<BudgetStartDayConfigResponse> {
    try {
      const response = await this.makeRequest('/budget-start-day');
      return await response.json();
    } catch (error) {
      console.error("Erro ao obter configuração do dia de início:", error);
      return {
        defaultDay: 1,
        overrides: [],
        error: "Erro ao obter configuração do dia de início",
      };
    }
  }

  async suggestCategory(request: SuggestCategoryRequest): Promise<SuggestCategoryResponse> {
    try {
      const response = await this.makeRequest('/suggest-category', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      console.error("Erro ao sugerir categoria:", error);
      return { error: "Erro ao sugerir categoria" };
    }
  }

  async suggestAllocation(amount: number): Promise<SuggestAllocationResponse> {
    try {
      const response = await this.makeRequest(`/suggest-allocation?amount=${amount}`);
      return await response.json();
    } catch (error) {
      console.error("Erro ao sugerir alocação:", error);
      return { error: "Erro ao sugerir alocação" };
    }
  }

  async getBoxes(): Promise<BoxDTO[]> {
    const response = await this.makeRequest('/boxes');
    return response.json();
  }

  async createBox(request: CreateBoxRequest): Promise<{ box?: BoxDTO; error?: string }> {
    try {
      const response = await this.makeRequest('/create-box', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      const box = await response.json();
      return { box };
    } catch (error) {
      console.error("Erro ao criar estrato:", error);
      return { error: "Erro ao criar estrato" };
    }
  }

  async editBox(request: EditBoxRequest): Promise<{ error?: string }> {
    try {
      await this.makeRequest('/edit-box', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return {};
    } catch (error) {
      console.error("Erro ao editar estrato:", error);
      return { error: "Erro ao editar estrato" };
    }
  }

  async deleteBox(boxId: string): Promise<{ error?: string }> {
    try {
      await this.makeRequest('/delete-box', {
        method: 'POST',
        body: JSON.stringify({ boxId }),
      });
      return {};
    } catch (error) {
      console.error("Erro ao deletar estrato:", error);
      return { error: "Erro ao deletar estrato" };
    }
  }

  async createTransfer(request: CreateTransferRequest): Promise<{ transferId?: string; error?: string }> {
    try {
      const response = await this.makeRequest('/create-transfer', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      const data = await response.json();
      return { transferId: data.transferId };
    } catch (error) {
      console.error("Erro ao criar transferência:", error);
      return { error: "Erro ao criar transferência" };
    }
  }

  async editTransfer(request: EditTransferRequest): Promise<{ error?: string }> {
    try {
      await this.makeRequest('/edit-transfer', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return {};
    } catch (error) {
      console.error("Erro ao editar transferência:", error);
      return { error: "Erro ao editar transferência" };
    }
  }

  async deleteTransfer(transferId: string): Promise<{ error?: string }> {
    try {
      await this.makeRequest('/delete-transfer', {
        method: 'POST',
        body: JSON.stringify({ transferId }),
      });
      return {};
    } catch (error) {
      console.error("Erro ao deletar transferência:", error);
      return { error: "Erro ao deletar transferência" };
    }
  }

  // --- Import de extrato (OFX) ---

  /**
   * Diferente de makeRequest, preserva a mensagem de erro da API. No import ela é o
   * principal sinal para o usuário ("Arquivo não parece ser um OFX válido"), então
   * trocá-la por um texto genérico deixaria a tela sem explicação.
   */
  private async makeImportRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}/vault/import${endpoint}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (response.status === 401) {
      throw new Error("Token de acesso inválido ou expirado.");
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
      throw new Error(message || "Erro ao conectar com o servidor");
    }

    return response;
  }

  async uploadImport(request: UploadImportRequest): Promise<UploadImportResponse> {
    try {
      const response = await this.makeImportRequest('/upload', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      console.error("Erro ao importar extrato:", error);
      return { error: error instanceof Error ? error.message : "Erro ao importar extrato" };
    }
  }

  async getImportReview(batchId: string, params?: ImportReviewParams): Promise<ImportReviewData> {
    const search = new URLSearchParams();
    if (params?.status) search.append("status", params.status);
    if (params?.page) search.append("page", params.page.toString());
    if (params?.pageSize) search.append("pageSize", params.pageSize.toString());

    const query = search.toString();
    const response = await this.makeImportRequest(`/batch/${batchId}${query ? `?${query}` : ""}`);
    return response.json();
  }

  async getImportBatches(): Promise<{ batches: ImportBatchListItem[] }> {
    const response = await this.makeImportRequest('/batches');
    return response.json();
  }

  async closeImportBatch(batchId: string): Promise<{ error?: string }> {
    try {
      await this.makeImportRequest('/batch/close', {
        method: 'POST',
        body: JSON.stringify({ batchId }),
      });
      return {};
    } catch (error) {
      console.error("Erro ao concluir importação:", error);
      return { error: error instanceof Error ? error.message : "Erro ao concluir" };
    }
  }

  async getImportGroups(batchId: string): Promise<{ groups: ImportGroupDTO[] }> {
    const response = await this.makeImportRequest(`/batch/${batchId}/groups`);
    return response.json();
  }

  async categorizeImportEntries(
    entryIds: string[],
    categoryId: string | null,
  ): Promise<{ updated?: number; error?: string }> {
    try {
      const response = await this.makeImportRequest('/entries/categorize', {
        method: 'POST',
        body: JSON.stringify({ entryIds, categoryId }),
      });
      return await response.json();
    } catch (error) {
      console.error("Erro ao categorizar lançamentos:", error);
      return { error: error instanceof Error ? error.message : "Erro ao categorizar" };
    }
  }

  async editImportEntry(
    request: EditImportEntryRequest,
  ): Promise<{ entry?: ImportEntryDTO; error?: string }> {
    try {
      const response = await this.makeImportRequest('/entry/edit', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return { entry: await response.json() };
    } catch (error) {
      console.error("Erro ao editar lançamento:", error);
      return { error: error instanceof Error ? error.message : "Erro ao editar lançamento" };
    }
  }

  async dismissImportEntry(entryId: string): Promise<{ entry?: ImportEntryDTO; error?: string }> {
    try {
      const response = await this.makeImportRequest('/entry/dismiss', {
        method: 'POST',
        body: JSON.stringify({ entryId }),
      });
      return { entry: await response.json() };
    } catch (error) {
      console.error("Erro ao ignorar lançamento:", error);
      return { error: error instanceof Error ? error.message : "Erro ao ignorar lançamento" };
    }
  }

  async confirmImportEntries(entryIds: string[]): Promise<ConfirmImportResponse> {
    try {
      const response = await this.makeImportRequest('/confirm', {
        method: 'POST',
        body: JSON.stringify({ entryIds }),
      });
      return await response.json();
    } catch (error) {
      console.error("Erro ao confirmar lançamentos:", error);
      return { error: error instanceof Error ? error.message : "Erro ao confirmar lançamentos" };
    }
  }

  async confirmImportTransfer(
    entryIds: string[],
    boxId: string,
  ): Promise<ConfirmImportResponse> {
    try {
      const response = await this.makeImportRequest('/confirm-transfer', {
        method: 'POST',
        body: JSON.stringify({ entryIds, boxId }),
      });
      return await response.json();
    } catch (error) {
      console.error("Erro ao confirmar transferência:", error);
      return { error: error instanceof Error ? error.message : "Erro ao confirmar transferência" };
    }
  }

  async confirmImportBatch(batchId: string): Promise<ConfirmImportResponse> {
    try {
      const response = await this.makeImportRequest('/batch/confirm', {
        method: 'POST',
        body: JSON.stringify({ batchId }),
      });
      return await response.json();
    } catch (error) {
      console.error("Erro ao confirmar importação:", error);
      return { error: error instanceof Error ? error.message : "Erro ao confirmar importação" };
    }
  }
}
