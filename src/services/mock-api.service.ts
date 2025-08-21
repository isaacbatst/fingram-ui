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
  
  constructor() {
    // Usar para debug: limpa o cache na inicialização para garantir dados atualizados
    this.resetCaches();
    console.log("MockApiService: Construtor chamado, caches resetados");
  }

  // Método para resetar os caches quando necessário, útil para debugging
  resetCaches(): void {
    this.mockTransactionsCache = [];
    this.categoriesCache = null;
    console.log("MockApiService: Caches resetados");
  }
  
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
    
    // Inicializa o cache de categorias com os mesmos dados do seed do backend
    this.categoriesCache = [
      {
        id: 'f00110c1-fd2f-42d2-b579-8cc337668d82',
        name: '🏡 Moradia',
        code: '1',
        type: 'expense',
        description: 'Aluguel, condomínio, contas de casa como luz, água, internet, gás, manutenção, IPTU, reformas...'
      },
      {
        id: 'a29eb76c-0def-43ef-9c21-95928616e6f5',
        name: '🛒 Compras',
        code: '2',
        type: 'expense',
        description: 'Supermercado, compras de alimentos, feira, padaria, higiene pessoal, itens de limpeza...'
      },
      {
        id: 'f2662cda-938f-4af6-8fcc-b9d6b7bfc061',
        name: '🚗 Transporte',
        code: '3',
        type: 'expense',
        description: 'Combustível, manutenção de veículos, impostos, Uber, 99, ônibus, metrô, estacionamento...'
      },
      {
        id: '9854990d-b348-4572-a077-dd4710cc9973',
        name: '🎓 Educação',
        code: '4',
        type: 'expense',
        description: 'Mensalidade escolar, faculdade, pós-graduação, cursos online, cursos técnicos, livros...'
      },
      {
        id: '2d865bfa-84a3-4b06-9ac0-23bb50439954',
        name: '🏥 Saúde',
        code: '5',
        type: 'expense',
        description: 'Remédios, farmácia, consultas médicas, exames, plano de saúde, academia, fisioterapia...'
      },
      {
        id: 'c5d35a1b-5d61-4412-9083-52bd9468fbe5',
        name: '🎉 Lazer',
        code: '6',
        type: 'expense',
        description: 'Cinema, shows, streaming, hobbies, bares, festas, restaurantes, viagens, turismo...'
      },
      {
        id: '206b9595-4929-4cc9-8bd9-8ec2aa73a27a',
        name: '💰 Investimentos',
        code: '7',
        type: 'expense',
        description: 'Poupança, aplicações financeiras, compra de ações, fundos de investimento, previdência privada...'
      },
      {
        id: '3562366d-861c-46de-a1f3-2d468134ec7f',
        name: '👪 Família & Pets',
        code: '8',
        type: 'expense',
        description: 'Filhos, creche, escola, roupas infantis, brinquedos, mesada, despesas com pais, pets...'
      },
      {
        id: 'ee5bc836-ca4c-432e-afeb-fc8728f54350',
        name: '🎁 Presentes',
        code: '9',
        type: 'expense',
        description: 'Presentes para familiares, amigos ou colegas, lembrancinhas, datas comemorativas...'
      },
      {
        id: 'd9837314-2262-4ff1-a74c-a1a64deedd34',
        name: '📦 Outros',
        code: '10',
        type: 'both',
        description: 'Despesas ou receitas diversas, pontuais, não recorrentes ou não encaixadas nas outras categorias...'
      },
      {
        id: 'd17708cd-dac1-4b3f-a647-c79840d67ee5',
        name: '💼 Trabalho',
        code: '11',
        type: 'income',
        description: 'Salário, freelance, bônus, comissão, décimo terceiro, férias recebidas, pagamento por serviços...'
      },
      {
        id: '4aaf2ae5-7f40-4bd1-a3bb-3e0c5f3d112a',
        name: '🧾 Impostos & Taxas',
        code: '12',
        type: 'expense',
        description: 'Imposto de Renda, taxas governamentais, cartório, taxas bancárias, tributos, INSS...'
      }
    ];
    
    console.log("Mock: Inicializando cache de categorias do seed");
    return this.categoriesCache;
  }

  async getTransactions(params?: TransactionsParams): Promise<Paginated<TransactionDTO>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Inicializa o cache se estiver vazio
    if (this.mockTransactionsCache.length === 0) {
      // Primeiro carrega as categorias para garantir consistência
      const categories = await this.getCategories();
      
      // Busca categorias pelo tipo para criar transações com categorias corretas
      const findCategoryByType = (type: 'income' | 'expense' | 'both'): Category => {
        const matchingCategories = categories.filter(cat => 
          cat.type === type || cat.type === 'both'
        );
        return matchingCategories[Math.floor(Math.random() * matchingCategories.length)];
      };
      
      // Categorias específicas para exemplos realistas
      const comprasCategory = categories.find(cat => cat.code === '2'); // Compras
      const transporteCategory = categories.find(cat => cat.code === '3'); // Transporte 
      const lazerCategory = categories.find(cat => cat.code === '6'); // Lazer
      const trabalhoCategory = categories.find(cat => cat.code === '11'); // Trabalho
      const investimentosCategory = categories.find(cat => cat.code === '7'); // Investimentos
      
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
          category: comprasCategory || findCategoryByType('expense')
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
          category: trabalhoCategory || findCategoryByType('income')
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
          category: transporteCategory || findCategoryByType('expense')
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
          category: lazerCategory || findCategoryByType('expense')
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
          category: investimentosCategory || findCategoryByType('expense')
        }
      ];
      console.log("Mock: Inicializando cache de transações com categorias do seed");
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
    console.log("Mock: Iniciando edição de transação", request);
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
    
    // Debug - mostrar categorias disponíveis
    if (request.newCategory) {
      const categories = await this.getCategories();
      console.log(`Mock: Buscando categoria ${request.newCategory} entre ${categories.length} categorias disponíveis`);
      console.log("Mock: Códigos de categorias disponíveis:", categories.map(c => c.code).join(", "));
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
        // Encontra a categoria correspondente pelo código
        const categories = await this.getCategories();
        const category = categories.find(cat => cat.code === request.newCategory);
        
        if (category) {
          transaction.category = {
            id: category.id,
            name: category.name,
            code: category.code,
            description: category.description || ""
          };
          console.log(`Mock: Categoria atualizada para: ${category.name} (${category.code})`);
        } else {
          console.log(`Mock: Categoria não encontrada com código: ${request.newCategory}`);
          // Tenta buscar por ID como fallback (caso o código esteja na realidade armazenando um ID)
          const categoryById = categories.find(cat => cat.id === request.newCategory);
          if (categoryById) {
            transaction.category = {
              id: categoryById.id,
              name: categoryById.name,
              code: categoryById.code,
              description: categoryById.description || ""
            };
            console.log(`Mock: Categoria encontrada por ID: ${categoryById.name} (${categoryById.code})`);
          } else {
            return { error: `Categoria não encontrada: ${request.newCategory}` };
          }
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
