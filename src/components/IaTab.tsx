import type { AgentInputItem, ToolApprovalItemJSON } from "@/types/agent";
import { parseSSE } from "@/utils/sse-parser";
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
  const [approvals, setApprovals] = useState<ToolApprovalItemJSON[]>([]);
  const streamingTextRef = useRef("");

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
    streamingTextRef.current = "";

    if (message) {
      setHistory((prev) => [
        ...prev,
        { type: "message", role: "user", content: message },
        {
          type: "message",
          role: "assistant",
          content: [],
          status: "in_progress",
        },
      ]);
    }

    try {
      const response = await fetch(
        `${StandaloneApiService.BASE_URL}/vault/agent/stream`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            conversationId,
            decisions: Object.fromEntries(decisions ?? []),
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Stream request failed");
      }

      const reader = response.body.getReader();

      for await (const sseEvent of parseSSE(reader)) {
        const data = JSON.parse(sseEvent.data);

        switch (sseEvent.event) {
          case "text_delta": {
            streamingTextRef.current += data.delta;
            const currentText = streamingTextRef.current;
            setHistory((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (
                lastIdx >= 0 &&
                updated[lastIdx].type === "message" &&
                updated[lastIdx].role === "assistant"
              ) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: currentText,
                  status: "completed",
                };
              }
              return updated;
            });
            break;
          }

          case "approval_requested": {
            if (data.conversationId) {
              setConversationId(data.conversationId);
            }
            setApprovals(data.approvals ?? []);
            break;
          }

          case "done": {
            if (data.conversationId) {
              setConversationId(data.conversationId);
            }
            if (data.history) {
              setHistory(data.history);
            }
            setApprovals([]);
            break;
          }

          case "error": {
            setHistory((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (
                lastIdx >= 0 &&
                updated[lastIdx].type === "message" &&
                updated[lastIdx].role === "assistant"
              ) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: "Desculpe, ocorreu um erro. Tente novamente.",
                  status: "completed",
                };
              }
              return updated;
            });
            break;
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setHistory((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (
          lastIdx >= 0 &&
          updated[lastIdx].type === "message" &&
          updated[lastIdx].role === "assistant"
        ) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: "Desculpe, ocorreu um erro. Tente novamente.",
            status: "completed",
          };
        }
        return updated;
      });
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
    <div className="flex flex-1 min-h-0 justify-center">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full items-center">
        <div className="flex flex-col flex-1 min-h-0 max-w-4xl w-full">
          <div className="flex-1 overflow-y-auto">
            {history && history.length > 0 ? (
              <History history={history} />
            ) : (
              <div className="h-full flex flex-col gap-4 items-center justify-center text-center px-2">
                <p className="text-3xl text-center mb-3 font-display">
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
          <form className="mx-4 sm:mx-0" onSubmit={handleSubmit}>
            <div className="gap-4 flex items-center w-full border border-border rounded-4xl p-2 focus-within:border-input">
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
