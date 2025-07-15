export interface SerializedCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface SerializedTransaction {
  id: string;
  code: string;
  amount: number;
  isCommitted: boolean;
  description?: string;
  createdAt: string; // Date como string JSON
  categoryId: string | null;
  type: 'expense' | 'income';
  vaultId: string;
}

export interface SerializedVault {
  id: string;
  token: string;
  customPrompt: string;
  createdAt: string; // Date como string JSON
  // As propriedades do Map são serializadas como arrays de [key, value]
  transactions: [string, SerializedTransaction][];
  budgets: [string, { category: SerializedCategory; amount: number }][];

  // NEW PROPERTIES
  balance: number; // Saldo atual do vault
  totalBudgetedAmount: number;
percentageTotalBudgetedAmount: number;
  totalSpentAmount: number; 
  totalIncomeAmount: number; 
}



// Funções auxiliares para obter valores do vault serializado
// Agora usando os valores pré-calculados pelo backend

/**
 * Retorna o saldo atual do cofre
 * @param vault O cofre serializado
 * @returns O saldo atual
 */
export function calculateBalance(vault: SerializedVault): number {
  // Usar o valor pré-calculado pelo backend
  return vault.balance;
}

/**
 * Retorna o total de receitas do cofre
 * @param vault O cofre serializado
 * @returns O total de receitas
 */
export function calculateTotalIncome(vault: SerializedVault): number {
  // Usar o valor pré-calculado pelo backend
  return vault.totalIncomeAmount;
}

/**
 * Retorna o total de despesas do cofre
 * @param vault O cofre serializado
 * @returns O total de despesas
 */
export function calculateTotalExpense(vault: SerializedVault): number {
  // Usar o valor pré-calculado pelo backend
  return vault.totalSpentAmount;
}
