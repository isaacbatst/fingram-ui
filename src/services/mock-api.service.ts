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

export class MockApiService implements ApiService {
  private isAuth = true;
  
  isAuthenticated(): boolean {
    return this.isAuth;
  }

  getSessionToken(): string | null {
    return this.isAuth ? "mock-token" : null;
  }

  async getSummary(): Promise<SummaryData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      vault: {
        id: "mock-vault-1",
        token: "mock-token",
        customPrompt: "Mock vault prompt",
        createdAt: new Date().toISOString(),
        transactions: [
          ["tx1", {
            id: "tx1",
            code: "TXN001",
            amount: -50.99,
            isCommitted: true,
            description: "Supermercado",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            categoryId: "cat1",
            type: "expense" as const,
            vaultId: "mock-vault-1"
          }],
          ["tx2", {
            id: "tx2",
            code: "TXN002",
            amount: 1500.00,
            isCommitted: true,
            description: "Salário",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            categoryId: "cat2",
            type: "income" as const,
            vaultId: "mock-vault-1"
          }],
          ["tx3", {
            id: "tx3",
            code: "TXN003",
            amount: -25.50,
            isCommitted: true,
            description: "Transporte",
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            categoryId: "cat3",
            type: "expense" as const,
            vaultId: "mock-vault-1"
          }]
        ],
        budgets: [
          ["cat1", {
            category: {
              id: "cat1",
              name: "Alimentação",
              code: "FOOD",
              description: "Gastos com alimentação"
            },
            amount: 500
          }],
          ["cat3", {
            category: {
              id: "cat3",
              name: "Transporte",
              code: "TRANSPORT",
              description: "Gastos com transporte"
            },
            amount: 200
          }]
        ],
        balance: 1423.51,
        totalBudgetedAmount: 700,
        percentageTotalBudgetedAmount: 45.2,
        totalSpentAmount: 76.49,
        totalIncomeAmount: 1500.00
      },
      budget: [
        {
          category: {
            id: "cat1",
            name: "Alimentação",
            code: "FOOD"
          },
          spent: 50.99,
          amount: 500,
          percentageUsed: 10.2
        },
        {
          category: {
            id: "cat3",
            name: "Transporte",
            code: "TRANSPORT"
          },
          spent: 25.50,
          amount: 200,
          percentageUsed: 12.75
        }
      ],
      date: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      }
    };
  }

  async getBudgetSummary(year?: number, month?: number): Promise<BudgetSummaryData> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      vault: {
        id: "mock-vault-1",
        token: "mock-token",
        customPrompt: "Mock vault prompt",
        createdAt: new Date().toISOString(),
        transactions: [],
        budgets: [
          ["cat1", {
            category: {
              id: "cat1",
              name: "Alimentação",
              code: "FOOD",
              description: "Gastos com alimentação"
            },
            amount: 500
          }]
        ],
        balance: 1423.51,
        totalBudgetedAmount: 500,
        percentageTotalBudgetedAmount: 35.1,
        totalSpentAmount: 50.99,
        totalIncomeAmount: 1500.00
      },
      budget: [
        {
          category: {
            id: "cat1",
            name: "Alimentação",
            code: "FOOD"
          },
          spent: 50.99,
          amount: 500,
          percentageUsed: 10.2
        }
      ],
      date: {
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1
      }
    };
  }

  async getCategories(): Promise<Category[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        id: "cat1",
        name: "Alimentação",
        code: "FOOD",
        type: "expense",
        description: "Gastos com alimentação"
      },
      {
        id: "cat2",
        name: "Salário",
        code: "SALARY",
        type: "income",
        description: "Receitas de salário"
      },
      {
        id: "cat3",
        name: "Transporte",
        code: "TRANSPORT",
        type: "expense",
        description: "Gastos com transporte"
      },
      {
        id: "cat4",
        name: "Lazer",
        code: "ENTERTAINMENT",
        type: "expense",
        description: "Gastos com entretenimento"
      },
      {
        id: "cat5",
        name: "Investimentos",
        code: "INVESTMENT",
        type: "both",
        description: "Aplicações e resgates"
      }
    ];
  }

  async getTransactions(params?: TransactionsParams): Promise<Paginated<TransactionDTO>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockTransactions: TransactionDTO[] = [
      {
        id: "tx1",
        code: "TXN001",
        amount: -50.99,
        isCommitted: true,
        description: "Supermercado Pão de Açúcar",
        createdAt: new Date(Date.now() - 86400000),
        type: "expense",
        vaultId: "mock-vault-1",
        category: {
          id: "cat1",
          name: "Alimentação",
          code: "FOOD",
          description: "Gastos com alimentação"
        }
      },
      {
        id: "tx2",
        code: "TXN002",
        amount: 1500.00,
        isCommitted: true,
        description: "Salário Mensal",
        createdAt: new Date(Date.now() - 172800000),
        type: "income",
        vaultId: "mock-vault-1",
        category: {
          id: "cat2",
          name: "Salário",
          code: "SALARY",
          description: "Receitas de salário"
        }
      },
      {
        id: "tx3",
        code: "TXN003",
        amount: -25.50,
        isCommitted: true,
        description: "Uber para trabalho",
        createdAt: new Date(Date.now() - 259200000),
        type: "expense",
        vaultId: "mock-vault-1",
        category: {
          id: "cat3",
          name: "Transporte",
          code: "TRANSPORT",
          description: "Gastos com transporte"
        }
      },
      {
        id: "tx4",
        code: "TXN004",
        amount: -89.90,
        isCommitted: true,
        description: "Cinema e pipoca",
        createdAt: new Date(Date.now() - 345600000),
        type: "expense",
        vaultId: "mock-vault-1",
        category: {
          id: "cat4",
          name: "Lazer",
          code: "ENTERTAINMENT",
          description: "Gastos com entretenimento"
        }
      },
      {
        id: "tx5",
        code: "TXN005",
        amount: -200.00,
        isCommitted: true,
        description: "Aplicação CDB",
        createdAt: new Date(Date.now() - 432000000),
        type: "expense",
        vaultId: "mock-vault-1",
        category: {
          id: "cat5",
          name: "Investimentos",
          code: "INVESTMENT",
          description: "Aplicações e resgates"
        }
      }
    ];

    // Filter by parameters (simplified)
    let filteredTransactions = mockTransactions;
    
    if (params?.description) {
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.description?.toLowerCase().includes(params.description!.toLowerCase())
      );
    }
    
    if (params?.categoryId) {
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.category?.id === params.categoryId
      );
    }

    const page = params?.page || 1;
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      items: filteredTransactions.slice(startIndex, endIndex),
      total: filteredTransactions.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredTransactions.length / pageSize)
    };
  }

  async editTransaction(request: EditTransactionRequest): Promise<EditTransactionResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Simulate success or error randomly for testing
    if (Math.random() > 0.9) {
      return { error: "Erro simulado ao editar transação" };
    }
    
    console.log("Mock: Transação editada com sucesso", request);
    return {};
  }

  async setBudgets(budgets: Budget[]): Promise<SetBudgetsResponse> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simulate success or error randomly for testing
    if (Math.random() > 0.8) {
      return { error: "Erro simulado ao definir orçamentos" };
    }
    
    console.log("Mock: Orçamentos definidos com sucesso", budgets);
    return {};
  }
}
