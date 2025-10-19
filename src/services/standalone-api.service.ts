import type { BudgetSummaryData } from "@/hooks/useBudgetSummary";
import type { SummaryData } from "@/hooks/useSummary";
import type { Category } from "@/hooks/useCategories";
import type { Paginated } from "@/utils/paginated";
import type { TransactionDTO } from "@/utils/transaction.dto,";
import type { TransactionsParams } from "@/hooks/useTransactions";
import type { 
  ApiService, 
  Budget, 
  SetBudgetsResponse, 
  EditTransactionRequest, 
  EditTransactionResponse,
  CreateTransactionRequest,
  CreateTransactionResponse
} from "./api.interface";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

export class StandaloneApiService implements ApiService {
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
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
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
}
