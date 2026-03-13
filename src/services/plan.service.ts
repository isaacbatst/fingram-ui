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

export interface BoxScheduledPaymentDTO {
  month: number;
  amount: number;
  label: string;
  additionalToMonthly?: boolean;
  sourceBoxId?: string;
}

export interface BoxFinancingDTO {
  principal: number;
  annualRate: number;
  termMonths: number;
  system: "sac" | "price";
  constructionMonths?: number;
  gracePeriodMonths?: number;
  releasePercent?: number;
}

export interface BoxDTO {
  id: string;
  label: string;
  target: number;
  monthlyAmount: ChangePointDTO[];
  holdsFunds: boolean;
  yieldRate?: number;
  financing?: BoxFinancingDTO;
  scheduledPayments: BoxScheduledPaymentDTO[];
}

export type PlanStatus = "draft" | "active" | "archived";

export interface PlanDTO {
  id: string;
  vaultId: string;
  name: string;
  status: PlanStatus;
  startDate: string;
  premises: PremisesDTO;
  boxes: BoxDTO[];
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
  boxes: Record<string, number>;
  boxPayments: Record<string, number>;
  boxYields: Record<string, number>;
  totalYield: number;
  scheduledPayments: { boxId: string; amount: number; label: string }[];
  totalWealth: number;
  totalCommitted: number;
  financingDetails: Record<string, FinancingMonthDetailDTO>;
}

// --- Requests ---
export interface CreatePlanRequest {
  name: string;
  startDate?: string;
  premises: PremisesDTO;
  boxes: Omit<BoxDTO, "id">[];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
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
    throw new Error("Token de acesso invalido ou expirado.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erro ${response.status}`);
  }

  return response.json();
}

export const planService = {
  getPlans(): Promise<PlanDTO[]> {
    return request("");
  },

  getPlan(id: string): Promise<PlanDTO> {
    return request(`/${id}`);
  },

  createPlan(data: CreatePlanRequest): Promise<PlanDTO> {
    return request("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getProjection(planId: string): Promise<MonthDataDTO[]> {
    return request(`/${planId}/projection`);
  },

  deletePlan(id: string): Promise<{ success: boolean }> {
    return request(`/${id}`, { method: "DELETE" });
  },
};
