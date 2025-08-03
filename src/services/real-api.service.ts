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
  EditTransactionResponse 
} from "./api.interface";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

export class RealApiService implements ApiService {
  private sessionToken: string | null = null;

  constructor(sessionToken: string | null) {
    this.sessionToken = sessionToken;
  }

  updateSessionToken(sessionToken: string | null) {
    this.sessionToken = sessionToken;
  }

  isAuthenticated(): boolean {
    return this.sessionToken !== null;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  async getSummary(): Promise<SummaryData> {
    if (!this.sessionToken) {
      throw new Error("Usuário não autenticado");
    }

    const response = await fetch(`${API_BASE_URL}/miniapp/summary`, {
      headers: {
        Authorization: `Bearer ${this.sessionToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error("Gere um novo link de acesso no bot.");
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
    }

    return response.json();
  }

  async getBudgetSummary(year?: number, month?: number): Promise<BudgetSummaryData> {
    if (!this.sessionToken) {
      throw new Error("Usuário não autenticado");
    }

    const url = new URL(`${API_BASE_URL}/miniapp/summary`);
    if (year && month) {
      url.searchParams.append("year", year.toString());
      url.searchParams.append("month", month.toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.sessionToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error("Gere um novo link de acesso no bot.");
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
    }

    return response.json();
  }

  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/miniapp/categories`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
    }

    return response.json();
  }

  async getTransactions(params?: TransactionsParams): Promise<Paginated<TransactionDTO>> {
    if (!this.sessionToken) {
      throw new Error("Usuário não autenticado");
    }

    const url = new URL(`${API_BASE_URL}/miniapp/transactions`);
    
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

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.sessionToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status}`);
    }

    return response.json();
  }

  async editTransaction(request: EditTransactionRequest): Promise<EditTransactionResponse> {
    if (!this.sessionToken) {
      return { error: "Token de sessão não encontrado" };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/miniapp/edit-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.sessionToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Erro ao editar transação";
        return { error: errorMessage };
      }

      return {};
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);
      return { error: "Erro ao conectar com o servidor" };
    }
  }

  async setBudgets(budgets: Budget[]): Promise<SetBudgetsResponse> {
    if (!this.sessionToken) {
      return { error: "Token de sessão não encontrado" };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/miniapp/set-budgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.sessionToken}`,
        },
        body: JSON.stringify({ 
          budgets: budgets.map(b => ({
            categoryCode: b.categoryId, // Backend expects categoryCode
            amount: b.amount
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Erro ao definir orçamentos";
        return { error: errorMessage };
      }

      return {};
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);
      return { error: "Erro ao conectar com o servidor" };
    }
  }
}
