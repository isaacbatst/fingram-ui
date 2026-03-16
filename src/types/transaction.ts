export type Transaction = {
  id: string;
  code: string;
  type: "income" | "expense";
  amount: number;
  category:
    | string
    | {
        id: string;
        name: string;
        code: string;
        description?: string;
      };
  categoryCode?: string;
  description: string;
  createdAt: string;
  date: string;
  boxId?: string;
  transferId?: string | null;
  transferToBoxId?: string;
  allocationId?: string | null;
};
