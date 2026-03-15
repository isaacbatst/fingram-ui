const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

// --- Change Point ---
export interface ChangePointDTO {
  month: number;
  amount: number;
}

// --- Plan ---
export interface PremisesDTO {
  salaryChangePoints: ChangePointDTO[];
  costOfLivingChangePoints: ChangePointDTO[];
}

export interface AllocationScheduledMovementDTO {
  month: number;
  amount: number;
  label: string;
  type: 'in' | 'out';
  destinationBoxId?: string;
  additionalToMonthly?: boolean;
}

export interface AllocationFinancingDTO {
  principal: number;
  annualRate: number;
  termMonths: number;
  system: "sac" | "price";
  constructionMonths?: number;
  gracePeriodMonths?: number;
  releasePercent?: number;
}

export interface AllocationDTO {
  id: string;
  label: string;
  target: number;
  monthlyAmount: ChangePointDTO[];
  holdsFunds: boolean;
  estratoId: string | null;
  yieldRate?: number;
  financing?: AllocationFinancingDTO;
  scheduledMovements: AllocationScheduledMovementDTO[];
}

export type PlanStatus = "draft" | "active" | "archived";

export interface PlanDTO {
  id: string;
  vaultId: string;
  name: string;
  status: PlanStatus;
  startDate: string;
  premises: PremisesDTO;
  allocations: AllocationDTO[];
  milestones: { month: number; label: string; type: string }[];
  createdAt: string;
}

// --- Projection ---
export type FinancingPhase = "construction" | "grace" | "amortization" | "paid_off";

export interface FinancingMonthDetailDTO {
  payment: number;
  amortization: number;
  interest: number;
  outstandingBalance: number;
  phase: FinancingPhase;
}

export interface MonthDataDTO {
  month: number;
  date: string;
  income: number;
  costOfLiving: number;
  surplus: number;
  cash: number;
  allocations: Record<string, number>;
  allocationPayments: Record<string, number>;
  allocationYields: Record<string, number>;
  totalYield: number;
  scheduledMovements: { allocationId: string; amount: number; label: string; type: 'in' | 'out'; destinationBoxId?: string }[];
  totalWealth: number;
  totalCommitted: number;
  financingDetails: Record<string, FinancingMonthDetailDTO>;
}

// --- Requests ---
export interface CreatePlanRequest {
  name: string;
  startDate?: string;
  premises: PremisesDTO;
  allocations: Omit<AllocationDTO, "id">[];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  errorMessage = "Erro ao processar requisição",
): Promise<T> {
  const url = `${API_BASE_URL}/plans${endpoint}`;

  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 401) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
}

export const planService = {
  getPlans(): Promise<PlanDTO[]> {
    return request("", {}, "Erro ao carregar planos");
  },

  getPlan(id: string): Promise<PlanDTO> {
    return request(`/${id}`, {}, "Erro ao carregar plano");
  },

  createPlan(data: CreatePlanRequest): Promise<PlanDTO> {
    return request(
      "",
      { method: "POST", body: JSON.stringify(data) },
      "Erro ao criar plano",
    );
  },

  getProjection(planId: string): Promise<MonthDataDTO[]> {
    return request(`/${planId}/projection`, {}, "Erro ao calcular projeção");
  },

  deletePlan(id: string): Promise<{ success: boolean }> {
    return request(`/${id}`, { method: "DELETE" }, "Erro ao excluir plano");
  },

  bindAllocation(planId: string, allocationId: string, estratoId: string | null): Promise<AllocationDTO> {
    return request(
      `/${planId}/allocations/${allocationId}`,
      { method: "PATCH", body: JSON.stringify({ estratoId }) },
      "Erro ao vincular estrato",
    );
  },
};
