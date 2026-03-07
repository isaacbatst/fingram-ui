const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

export interface PremisesDTO {
  salary: number;
  monthlyCost: number;
  monthlyInvestment?: number;
}

export interface FundRuleDTO {
  fundId: string;
  label: string;
  target: number;
  priority: number;
}

export interface PlanDTO {
  id: string;
  name: string;
  status: "draft" | "active" | "archived";
  startDate: string;
  premises: PremisesDTO;
  fundAllocation: FundRuleDTO[];
}

export interface MonthDataDTO {
  month: number;
  date: string;
  income: number;
  expenses: number;
  surplus: number;
  funds: Record<string, number>;
}

export interface CreatePlanRequest {
  name: string;
  startDate?: string;
  premises: PremisesDTO;
  fundAllocation: FundRuleDTO[];
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
