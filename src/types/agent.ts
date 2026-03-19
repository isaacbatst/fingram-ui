// Local types for agent API responses.
// Replaces @openai/agents types to avoid bundling the SDK in the frontend.

export type AgentInputItem = {
  type: string;
  role?: string;
  content?: string | Array<Record<string, unknown>>;
  status?: string;
  name?: string;
  arguments?: string;
  callId?: string;
  id?: string;
  output?: string | Record<string, unknown>;
  [key: string]: unknown;
};

export type ToolApprovalItemJSON = {
  type: string;
  rawItem: {
    callId: string;
    name: string;
    arguments: string;
    type: string;
    id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
