import { useState } from "react";
import { Check, Copy, PlugZap, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useMcpConnections } from "@/hooks/useMcpConnections";
import { StandaloneApiService } from "@/services/standalone-api.service";
import type { McpConnection } from "@/services/api.interface";

const MCP_URL = `${StandaloneApiService.BASE_URL.replace(/\/+$/, "")}/mcp`;

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

/**
 * Conexões com clientes de IA via MCP. Substitui o antigo chat in-app: o
 * usuário conversa com o Duna a partir do próprio assistente (Claude, ChatGPT…).
 */
export function ConexoesTab() {
  const { connections, isLoading, error, revoke } = useMcpConnections();

  return (
    <div className="flex flex-col gap-8 py-4">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl tracking-tight">
          Use o Duna no seu assistente de IA
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Conecte o Duna ao Claude, ChatGPT ou outro app compatível com MCP
          para consultar gastos, orçamento e plano, e registrar transações
          conversando.
        </p>

        <div className="duna-surface rounded-lg border border-[var(--color-border)] p-4 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Endereço do servidor MCP
          </span>
          <CopyableUrl url={MCP_URL} />
          <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1.5 leading-relaxed">
            <li>
              No seu assistente, adicione um conector personalizado (no Claude:
              Configurações → Conectores).
            </li>
            <li>Cole o endereço acima.</li>
            <li>Entre com o seu Duna e permita o acesso.</li>
          </ol>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-lg tracking-tight">
          Apps conectados
        </h3>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorDisplay error="Erro ao carregar conexões" />
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-2 py-8 px-6">
            <PlugZap className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Nenhum app conectado ainda. Quando você autorizar um, ele aparece
              aqui.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {connections.map((connection) => (
              <ConnectionRow
                key={connection.clientId}
                connection={connection}
                onRevoke={() => revoke(connection.clientId)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o endereço e copie.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 min-w-0 font-mono text-sm truncate rounded-md border border-[var(--color-border)] px-3 py-2.5 select-all">
        {url}
      </code>
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0"
        onClick={copy}
        aria-label="Copiar endereço"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function ConnectionRow({
  connection,
  onRevoke,
}: {
  connection: McpConnection;
  onRevoke: () => Promise<void>;
}) {
  const [revoking, setRevoking] = useState(false);
  const name = connection.clientName ?? "App sem nome";

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await onRevoke();
    } catch {
      toast.error("Não foi possível desconectar. Tente novamente.");
      setRevoking(false);
    }
  };

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          Conectado em {formatDate(connection.connectedAt)}
          {connection.lastUsedAt &&
            ` · Último uso em ${formatDate(connection.lastUsedAt)}`}
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            className="h-11 shrink-0 text-muted-foreground"
            disabled={revoking}
          >
            <Unplug className="w-4 h-4 mr-2" />
            Desconectar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O app perde o acesso ao seu Duna imediatamente. Para usar de
              novo, será preciso conectar outra vez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
