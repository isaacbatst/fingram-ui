import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useApi } from "@/hooks/useApi";
import { useCardNav } from "@/hooks/useCardNav";
import { refreshAfterCardChange, useInvoices } from "@/hooks/useCards";
import { formatBRL, formatDayMonth, formatPeriod, monthName } from "@/lib/invoice";
import { cn } from "@/lib/utils";
import type { PendingStatement, ReprocessReport } from "@/services/api.interface";
import { ACCENT_CTA, ScreenHeader, SectionTitle } from "./shared";

const monthLabel = (year: number, month: number) => {
  const name = monthName(month);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};

function Report({ report }: { report: ReprocessReport }) {
  return (
    <div className="space-y-6">
      {report.months.length > 0 && (
        <section>
          <SectionTitle>Gastos por mês</SectionTitle>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="text-left font-normal pb-1">Mês</th>
                <th className="text-right font-normal pb-1">Hoje</th>
                <th className="w-6" aria-hidden />
                <th className="text-right font-normal pb-1">Depois</th>
              </tr>
            </thead>
            <tbody>
              {report.months.map((m) => {
                const diff = m.after - m.before;
                return (
                  <tr key={`${m.year}-${m.month}`} className="border-t border-[var(--color-border-subtle)]">
                    <td className="py-2">{monthLabel(m.year, m.month)}</td>
                    <td className="py-2 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {formatBRL(m.before)}
                    </td>
                    <td className="py-2 text-center">
                      <ArrowRight className="size-3 inline text-muted-foreground" />
                    </td>
                    <td
                      className={cn(
                        "py-2 text-right font-mono whitespace-nowrap",
                        diff > 0 && "text-[var(--color-danger)]",
                        diff < 0 && "text-[var(--color-success)]",
                      )}
                    >
                      {formatBRL(m.after)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {report.statements.length > 0 && (
        <section>
          <SectionTitle>Extratos de cartão que viram fatura</SectionTitle>
          <ul className="space-y-2">
            {report.statements.map((s) => (
              <li key={s.batchId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">
                    {s.cardName}
                    {s.newCard && <span className="text-muted-foreground"> · cartão novo</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    fatura que fecha {formatDayMonth(s.closingDate)} · {s.purchaseCount}{" "}
                    {s.purchaseCount === 1 ? "compra" : "compras"}
                  </span>
                </span>
                <span className="font-mono whitespace-nowrap">{formatBRL(s.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.payments.length > 0 && (
        <section>
          <SectionTitle>Débitos que viram pagamento de fatura</SectionTitle>
          <ul className="space-y-2">
            {report.payments.map((p) => (
              <li key={p.entryId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">
                    {formatDayMonth(p.date)} · {p.cardName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {p.source === "expense"
                      ? "estava lançado como gasto comum, que sai"
                      : "estava ignorado na revisão do import"}
                  </span>
                </span>
                <span className="font-mono whitespace-nowrap">{formatBRL(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.skipped.length > 0 && (
        <section>
          <SectionTitle>Fica como está</SectionTitle>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {report.skipped.map((s, i) => (
              <li key={s.entryId ?? s.batchId ?? i}>{s.reason}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * Extrato de cartão antigo que não é de fatura (ex.: cartão de terceiro já
 * acertado): marcado "sem fatura", sai do reprocessamento e as compras seguem
 * contando na data delas.
 */
function PendingStatementRow({ statement }: { statement: PendingStatement }) {
  const { apiService } = useApi();
  const [busy, setBusy] = useState(false);
  const markNoInvoice = async () => {
    setBusy(true);
    const result = await apiService.setImportBatchNoInvoice(statement.batchId, true);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
  };
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="min-w-0">
        <span className="block truncate">{statement.accountLabel ?? "Extrato de cartão"}</span>
        <span className="block text-xs text-muted-foreground">
          {[
            formatPeriod(statement.periodStart, statement.periodEnd),
            `${statement.purchaseCount} ${statement.purchaseCount === 1 ? "compra" : "compras"}`,
            formatBRL(statement.total),
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 shrink-0 text-muted-foreground"
        disabled={busy}
        onClick={() => void markNoInvoice()}
      >
        {busy && <Loader2 className="animate-spin" />}
        Sem fatura
      </Button>
    </li>
  );
}

const isEmpty = (r: ReprocessReport) =>
  r.statements.length === 0 && r.payments.length === 0 && r.months.length === 0;

/**
 * Converte o histórico de antes dos cartões: extratos de cartão sem fatura
 * viram fatura com compras, e débitos de pagamento ignorados (ou lançados como
 * gasto) viram pagamentos. Opt-in: a prévia não grava nada, e aplicar grava
 * exatamente o que ela mostrou.
 */
export function ReprocessView() {
  const nav = useCardNav();
  const { apiService, isAuthenticated } = useApi();
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? "reprocess-preview" : null,
    () => apiService.previewReprocess(),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const [confirming, setConfirming] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const { pendingStatements } = useInvoices();

  const apply = async () => {
    setIsApplying(true);
    const result = await apiService.applyReprocess();
    setIsApplying(false);
    setConfirming(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Histórico reprocessado.");
    await refreshAfterCardChange();
  };

  return (
    <div className="flex flex-col pb-6">
      <ScreenHeader
        backLabel="Estratos"
        onBack={nav.backToEstratos}
        title="Reprocessar histórico"
        subtitle="Antes dos cartões, compras contavam na data da compra e o pagamento da fatura era ignorado. Reprocessar passa a contar tudo na data do pagamento."
      />

      {isLoading && !data ? (
        <LoadingSpinner />
      ) : error || !data ? (
        <ErrorDisplay
          error={error instanceof Error ? error.message : "Erro ao calcular a prévia"}
          onRetry={mutate}
          className="my-4"
        />
      ) : isEmpty(data) ? (
        <p className="text-sm text-muted-foreground py-6 text-center leading-relaxed">
          Nada a reprocessar. O histórico já segue o modelo de cartões.
        </p>
      ) : (
        <>
          <div className="rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 mb-5">
            <p className="text-sm text-foreground leading-relaxed">
              Os totais de meses passados mudam.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Confira a prévia: nada é gravado até você aplicar.
            </p>
          </div>
          {pendingStatements.length > 0 && (
            <section className="mb-6">
              <SectionTitle>Extratos de cartão antigos</SectionTitle>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                As compras deles ainda contam na data da compra. Se algum não é
                de fatura, marque "sem fatura" e ele fica de fora.
              </p>
              <ul className="space-y-1">
                {pendingStatements.map((s) => (
                  <PendingStatementRow key={s.batchId} statement={s} />
                ))}
              </ul>
            </section>
          )}
          <Report report={data} />
          <Button className={`${ACCENT_CTA} mt-6`} onClick={() => setConfirming(true)}>
            Aplicar
          </Button>
        </>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar o reprocessamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Os gastos dos meses da prévia passam para os valores novos, e o
              orçamento desses meses muda junto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplying}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isApplying}
              onClick={(event) => {
                event.preventDefault();
                void apply();
              }}
            >
              {isApplying && <Loader2 className="animate-spin" />}
              Aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
