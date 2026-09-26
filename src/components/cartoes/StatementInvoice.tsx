import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";
import { useCardNav } from "@/hooks/useCardNav";
import { refreshAfterCardChange, useInvoiceDetail, useInvoices } from "@/hooks/useCards";
import { formatBRL, formatDayMonth, formatPeriod, invoiceTitle } from "@/lib/invoice";
import type { ImportBatchDTO } from "@/services/api.interface";

/**
 * Na revisão de um extrato de cartão: a que cartão e fatura (ciclo) ele
 * pertence. As linhas confirmadas viram compras dessa fatura e só contam nos
 * gastos quando um pagamento as cobre. "Sem fatura" é a saída para um extrato
 * que não é de fatura: as compras contam na data delas.
 */
export function StatementInvoice({ batch }: { batch: ImportBatchDTO }) {
  const nav = useCardNav();
  const { apiService } = useApi();
  const { data: detail } = useInvoiceDetail(batch.invoiceId);
  const { invoices } = useInvoices();
  const [busy, setBusy] = useState(false);
  const [confirmingNoInvoice, setConfirmingNoInvoice] = useState(false);

  const run = async (steps: (() => Promise<{ error?: string }>)[]) => {
    setBusy(true);
    for (const step of steps) {
      const result = await step();
      if (result.error) {
        setBusy(false);
        toast.error(result.error);
        await refreshAfterCardChange();
        return;
      }
    }
    setBusy(false);
    setConfirmingNoInvoice(false);
    await refreshAfterCardChange();
  };

  const markNoInvoice = () =>
    run([
      // Ligado a uma fatura, a API exige desligar antes de marcar.
      ...(batch.invoiceId ? [() => apiService.setImportBatchInvoice(batch.id, null)] : []),
      () => apiService.setImportBatchNoInvoice(batch.id, true),
    ]);

  const invoice = detail?.invoice;

  if (batch.invoiceId) {
    return (
      <div className="rounded-md border border-[var(--color-border)] px-3 py-2.5 mb-2 flex flex-col gap-1.5">
        <div className="flex items-start gap-2.5">
          <CreditCard className="size-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0 text-sm">
            {invoice ? (
              <>
                <span className="text-foreground">
                  {invoice.cardName} · {invoiceTitle(invoice)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatPeriod(invoice.periodStart, invoice.closingDate)} · vence{" "}
                  {formatDayMonth(invoice.dueDate)}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Fatura do cartão…</span>
            )}
          </div>
        </div>
        {confirmingNoInvoice ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              O extrato sai da fatura e as compras já confirmadas passam a contar
              na data em que foram feitas, sem esperar pagamento.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => setConfirmingNoInvoice(false)}>
                Cancelar
              </Button>
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => void markNoInvoice()}>
                {busy && <Loader2 className="animate-spin" />}
                Sem fatura
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed">
              As compras confirmadas entram nesta fatura e contam nos gastos
              quando a fatura for paga.
            </p>
            <div className="flex gap-1 -ml-3">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 text-[var(--color-accent)]"
                onClick={() => nav.openInvoice(batch.invoiceId!)}
              >
                Ver fatura
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 text-muted-foreground"
                onClick={() => setConfirmingNoInvoice(true)}
              >
                Não é fatura
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (batch.noInvoice) {
    return (
      <div className="rounded-md border border-[var(--color-border)] px-3 py-2.5 mb-2 flex items-center gap-2.5">
        <CreditCard className="size-4 text-muted-foreground shrink-0" />
        <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
          Sem fatura: as compras contam na data em que foram feitas.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 shrink-0"
          disabled={busy}
          onClick={() => void run([() => apiService.setImportBatchNoInvoice(batch.id, false)])}
        >
          Desfazer
        </Button>
      </div>
    );
  }

  // Extrato antigo, de antes dos cartões: ainda sem fatura.
  return (
    <div className="rounded-md border border-[var(--color-border)] px-3 py-2.5 mb-2 flex flex-col gap-2">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Este extrato não está numa fatura: as compras contam na data em que
        foram feitas. Ligue-o à fatura que o pagou, ou marque sem fatura.
      </p>
      {invoices.length > 0 && (
        <Select
          disabled={busy}
          onValueChange={(invoiceId) =>
            void run([() => apiService.setImportBatchInvoice(batch.id, invoiceId)])
          }
        >
          <SelectTrigger className="min-h-11 w-full">
            <SelectValue placeholder="Ligar a uma fatura" />
          </SelectTrigger>
          <SelectContent>
            {invoices.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.cardName} · {invoiceTitle(i)} · {formatBRL(i.total)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="min-h-11 self-start -ml-3 text-muted-foreground"
        disabled={busy}
        onClick={() => void markNoInvoice()}
      >
        Sem fatura
      </Button>
    </div>
  );
}
