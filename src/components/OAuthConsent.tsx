import { useEffect, useState } from "react";
import { Check, Loader2, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import type { OAuthConsentDetails } from "@/services/api.interface";

export const OAUTH_REQUEST_PARAM = "oauth_request";

const CAPABILITIES = [
  "Ver suas transações, categorias, orçamento e plano",
  "Registrar e remover transações",
  "Alterar premissas e alocações do plano",
];

/**
 * Tela de consentimento do OAuth do servidor MCP. O backend redireciona para
 * cá com o pedido assinado em ?oauth_request=; ao decidir, o navegador volta
 * para o app de IA com o código (ou com access_denied).
 */
export function OAuthConsent({ request }: { request: string }) {
  const { apiService } = useApi();
  const [details, setDetails] = useState<OAuthConsentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    apiService
      .getOAuthConsent(request)
      .then((data) => {
        if (!cancelled) setDetails(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o pedido de conexão.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiService, request]);

  const decide = async (decision: "approve" | "deny") => {
    setSubmitting(decision);
    setError(null);
    try {
      const { redirectUrl } =
        decision === "approve"
          ? await apiService.approveOAuthConsent(request)
          : await apiService.denyOAuthConsent(request);
      window.location.assign(redirectUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a autorização.",
      );
      setSubmitting(null);
    }
  };

  const clientName = details?.clientName ?? "Um aplicativo";
  const returnHost = details ? new URL(details.redirectUri).host : null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <Card className="w-full max-w-md duna-surface border-[var(--color-border)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-bg)]">
            <PlugZap className="h-6 w-6 text-[var(--color-accent)]" />
          </div>
          <CardTitle className="font-display tracking-tight">
            {details ? `Conectar ${clientName} ao Duna` : "Conectar ao Duna"}
          </CardTitle>
          {details && (
            <CardDescription>
              {clientName} poderá acessar este Duna em seu nome.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {!details && !error && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {details && (
            <>
              <ul className="space-y-2.5 text-sm">
                {CAPABILITIES.map((capability) => (
                  <li key={capability} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-accent)]" />
                    <span>{capability}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você pode desconectar a qualquer momento na aba Conexões. Depois
                de decidir, você volta para{" "}
                <span className="font-mono">{returnHost}</span>.
              </p>
            </>
          )}

          {error && (
            <div className="text-sm text-destructive bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] rounded-md p-3">
              {error}
            </div>
          )}

          {details && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11"
                disabled={submitting !== null}
                onClick={() => decide("deny")}
              >
                {submitting === "deny" && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Negar
              </Button>
              <Button
                className="flex-1 h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]"
                disabled={submitting !== null}
                onClick={() => decide("approve")}
              >
                {submitting === "approve" && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Permitir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
