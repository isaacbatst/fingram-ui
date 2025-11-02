import type { AgentInputItem, RunToolApprovalItem } from "@openai/agents";
import { ArrowUpIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { History } from "./IaHistory";
import { Button } from "./ui/button";
import { Approvals } from "./IaApprovals";
import { StandaloneApiService } from "../services/standalone-api.service";

export function IaTab() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<AgentInputItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<
    ReturnType<RunToolApprovalItem["toJSON"]>[]
  >([]);
  const onSend = async (message: string) => {
    await makeRequest({ message });
  };

  async function onDone(decisions: Map<string, "approved" | "rejected">) {
    await makeRequest({ decisions });
  }

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    const msg = message;
    setMessage("");
    await onSend(msg);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;
    await handleSend();
  };

  async function makeRequest({
    message,
    decisions,
  }: {
    message?: string;
    decisions?: Map<string, "approved" | "rejected">;
  }) {
    const messages = [...history];

    if (message) {
      messages.push({ type: "message", role: "user", content: message });
    }

    const lastHistory = history[history.length - 1];
    if (
      !lastHistory ||
      ("status" in lastHistory && lastHistory.status !== "in_progress")
    ) {
      setHistory([
        ...messages,
        // This is just a placeholder to show on the UI to show the agent is working
        {
          type: "message",
          role: "assistant",
          content: [],
          status: "in_progress",
        },
      ]);
    }

    // We will send the messages to the API route along with the conversation ID if we have one
    // and the decisions if we had any approvals in this turn
    const response = await fetch(
      `${StandaloneApiService.BASE_URL}/vault/agent`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          conversationId,
          decisions: Object.fromEntries(decisions ?? []),
        }),
      }
    );

    const data = await response.json();
    if (data.conversationId) {
      setConversationId(data.conversationId);
    }

    if (data.history) {
      setHistory(data.history);
    }

    if (data.approvals) {
      setApprovals(data.approvals);
    } else {
      setApprovals([]);
    }
  }

  const suggestions = [
    "Almoço 20 Reais",
    "Aluguel 1000 Reais",
    "Salário 3000 Reais",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="flex flex-1 min-h-0 pb-4 justify-center">
      <div className="sm:p-4  flex flex-col flex-1 min-h-0 max-w-6xl w-full items-center">
        <div className="flex flex-col flex-1 min-h-0 max-w-4xl w-full">
          <div className="flex-1 overflow-y-auto">
            {history && history.length > 0 ? (
              <History history={history} />
            ) : (
              <div className="h-full flex flex-col gap-4 items-center justify-center text-center px-2">
                <p className="text-3xl text-center mb-3">
                  Descreva qual seus últimos gastos.
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {suggestions.map((suggestion) => (
                    <Button
                      variant="outline"
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <form className="mx-2" onSubmit={handleSubmit}>
            <div className="gap-4 flex items-center w-full border border-gray-300 rounded-4xl p-2 focus-within:border-gray-500">
              <input
                type="text"
                className="flex-1 p-2 focus:outline-none"
                value={message}
                placeholder="Digite sua mensagem..."
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                ref={inputRef}
              />
              <Button
                size="icon"
                type="submit"
                className="rounded-full"
                disabled={isLoading || !message.trim()}
              >
                <ArrowUpIcon />
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Approvals approvals={approvals} onDone={onDone} />
    </div>
  );
}
