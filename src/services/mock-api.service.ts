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
  private mockTransactionsCache: TransactionDTO[] = [];
  private categoriesCache: Category[] | null = null;
  
  isAuthenticated(): boolean {
    return this.isAuth;
  }

  getSessionToken(): string | null {
    return this.isAuth ? "mock-token" : null;
  }

  async getSummary(): Promise<SummaryData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Garante que o cache de transações está inicializado
    if (this.mockTransactionsCache.length === 0) {
      const transactions = await this.getTransactions();
      this.mockTransactionsCache = [...transactions.items];
    }
    
    // Calcula saldo e totais a partir do cache de transações
    let balance = 0;
    let totalSpentAmount = 0;
    let totalIncomeAmount = 0;
    
    // Processa as transações para obter os valores atualizados
    const transactionsMap: [string, {
      id: string;
      code: string;
      amount: number;
      isCommitted: boolean;
      description: string;
      createdAt: string;
      categoryId: string;
      type: "income" | "expense";
      vaultId: string;
    }][] = this.mockTransactionsCache.map(tx => {
      // Ajusta valores financeiros
      const amount = tx.amount;
      if (tx.type === "expense") {
        totalSpentAmount += Math.abs(amount);
      } else {
        totalIncomeAmount += amount;
      }
      balance += amount;
      
      // Converte para o formato esperado pelo SummaryData
      return [tx.id, {
        id: tx.id,
        code: tx.code,
        amount: amount,
        isCommitted: true,
        description: tx.description || "",
        createdAt: tx.createdAt.toISOString(),
        categoryId: tx.category?.id || "",
        type: tx.type,
        vaultId: tx.vaultId
      }];
    });
    
    // Define valores constantes de orçamento para simplicidade
    const totalBudgetedAmount = 700;
    const percentageTotalBudgetedAmount = Math.min(100, (totalBudgetedAmount / totalIncomeAmount) * 100);
    
    return {
      vault: {
        id: "mock-vault-1",
        token: "mock-token",
        customPrompt: "Mock vault prompt",
        createdAt: new Date().toISOString(),
        transactions: transactionsMap,
        budgets: [],
        balance: balance,
        totalBudgetedAmount: totalBudgetedAmount,
        percentageTotalBudgetedAmount: percentageTotalBudgetedAmount,
        totalSpentAmount: totalSpentAmount,
        totalIncomeAmount: totalIncomeAmount
      },
      budget: [],
      date: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      }
    };
  }

  async getBudgetSummary(year?: number, month?: number): Promise<BudgetSummaryData> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Usa os mesmos cálculos do getSummary para manter consistência
    const summaryData = await this.getSummary();
    
    return {
      vault: {
        ...summaryData.vault,
        // Para o budget summary, não enviamos as transações completas
        transactions: [],
        // O valor do orçamento no resumo pode ser um pouco diferente
        totalBudgetedAmount: 500,
        percentageTotalBudgetedAmount: Math.min(100, (500 / summaryData.vault.totalIncomeAmount) * 100),
      },
      budget: [],
      date: {
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1
      }
    };
  }

  async getCategories(): Promise<Category[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Usar o cache se já existir
    if (this.categoriesCache) {
      console.log("Mock: Retornando categorias do cache");
      return this.categoriesCache;
    }
    
    // Inicializa o cache de categorias
    this.categoriesCache = [
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
    
    console.log("Mock: Inicializando cache de categorias");
    return this.categoriesCache;
  }

  async getTransactions(params?: TransactionsParams): Promise<Paginated<TransactionDTO>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Inicializa o cache se estiver vazio
    if (this.mockTransactionsCache.length === 0) {
      this.mockTransactionsCache = [
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
      console.log("Mock: Inicializando cache de transações");
    }

    // Filtragem e paginação usando o cache
    let filteredTransactions = [...this.mockTransactionsCache];
    
    // Filtrar por mês e ano, se especificados
    if (params?.month && params?.year) {
      filteredTransactions = filteredTransactions.filter(tx => {
        const date = new Date(tx.createdAt);
        return (
          date.getMonth() + 1 === params.month && 
          date.getFullYear() === params.year
        );
      });
    }
    
    // Filtrar por descrição, se especificada
    if (params?.description) {
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.description?.toLowerCase().includes(params.description!.toLowerCase())
      );
    }
    
    // Filtrar por categoria, se especificada
    if (params?.categoryId) {
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.category?.id === params.categoryId
      );
    }

    // Ordenar por data (mais recente primeiro)
    filteredTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

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
    
    // Baixa probabilidade de erro aleatório para testes
    if (Math.random() > 0.95) {
      console.log("Mock: Erro simulado na edição de transação");
      return { error: "Erro simulado ao editar transação" };
    }
    
    // Validações
    if (request.newType && !['income', 'expense'].includes(request.newType)) {
      console.log("Mock: Tipo de transação inválido", request.newType);
      return { error: "Tipo de transação inválido" };
    }
    
    // Encontre a transação no cache ou carregue o cache se estiver vazio
    if (this.mockTransactionsCache.length === 0) {
      const transactionsResult = await this.getTransactions();
      this.mockTransactionsCache = [...transactionsResult.items];
    }
    
    // Encontre e atualize a transação no cache
    const transactionIndex = this.mockTransactionsCache.findIndex(tx => tx.code === request.transactionCode);
    if (transactionIndex >= 0) {
      const transaction = this.mockTransactionsCache[transactionIndex];
      
      // Atualiza a transação no cache
      if (request.newAmount !== undefined) {
        transaction.amount = request.newType === 'expense' 
          ? -Math.abs(request.newAmount) 
          : Math.abs(request.newAmount);
      }
      
      if (request.newDate) {
        transaction.createdAt = new Date(request.newDate);
      }
      
      if (request.newType) {
        transaction.type = request.newType;
        // Ajusta o sinal do valor com base no tipo
        transaction.amount = request.newType === 'expense' 
          ? -Math.abs(transaction.amount) 
          : Math.abs(transaction.amount);
      }
      
      if (request.newCategory) {
        // Encontra a categoria correspondente
        const categories = await this.getCategories();
        const category = categories.find(cat => cat.code === request.newCategory);
        
        if (category) {
          transaction.category = {
            id: category.id,
            name: category.name,
            code: category.code,
            description: category.description || ""
          };
        } else {
          console.log(`Mock: Categoria não encontrada: ${request.newCategory}`);
        }
      }
      
      if (request.newDescription !== undefined) {
        transaction.description = request.newDescription;
      }
      
      console.log("Mock: Transação editada com sucesso:", transaction);
    } else {
      console.log(`Mock: Transação não encontrada: ${request.transactionCode}`);
      return { error: "Transação não encontrada" };
    }
    
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
