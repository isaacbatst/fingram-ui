import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { CreditCard, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";
import { useInvoices } from "@/hooks/useInvoices";
import { useSearchParams } from "@/hooks/useSearchParams";
import { formatDayMonth, invoiceTitle, invoicesNeedingAttention } from "@/lib/invoice";
import type { InvoiceDTO } from "@/services/api.interface";

const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Ligar ou excluir uma fatura muda datas, estratos e totais de uma vez: tudo
 * que foi carregado do servidor precisa ser relido.
 */
function refreshAfterInvoiceChange() {
  void globalMutate(() => true, undefined, { revalidate: true });
}

const NONE = "none";

/** Escolhe a fatura que um extrato de cartão detalha. */
export function InvoiceLinkSelect({
  batchId,
  invoiceId,
  invoices,
  id,
}: {
  batchId: string;
  invoiceId: string | null;
  invoices: InvoiceDTO[];
  id?: string;
}) {
  const { apiService } = useApi();
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (value: string) => {
    setIsSaving(true);
    const result = await apiService.setImportBatchInvoice(
      batchId,
      value === NONE ? null : value,
    );
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    refreshAfterInvoiceChange();
  };

  return (
    <Select
      value={invoiceId ?? NONE}
      onValueChange={(value) => void handleChange(value)}
      disabled={isSaving}
    >
      <SelectTrigger id={id} className="min-h-11 w-full">
        <SelectValue placeholder="Escolha a fatura" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Sem fatura</SelectItem>
        {invoices.map((invoice) => (
          <SelectItem key={invoice.id} value={invoice.id}>
            {invoiceTitle(invoice)} · {formatMoney(invoice.amount)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Faturas com parte ainda sem detalhe e compras de cartão que ainda não estão
 * em nenhuma fatura. É o que torna visível uma fatura cujas compras nunca foram
 * importadas: o valor já conta no mês, mas sem categoria.
 *
 * Com `period`, só as faturas pagas nele (o mês aberto em Gastos).
 */
export function FaturasAviso({
  period,
  showImportCta = true,
}: {
  period?: { startDate: Date; endDate: Date };
  showImportCta?: boolean;
}) {
  const { invoices, unlinkedStatements } = useInvoices();
  const [, setSearchParams] = useSearchParams();

  const pending = invoicesNeedingAttention(invoices, period);
  if (pending.length === 0 && unlinkedStatements.length === 0) return null;

  const openImport = () => setSearchParams({ aba: "input", entrada: "importar" });

  return (
    <section
      aria-label="Faturas de cartão"
      className="flex flex-col gap-2 mb-5"
    >
      {pending.map((invoice) => (
        <div
          key={invoice.id}
          className="rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 flex flex-col gap-2"
        >
          <div className="flex items-start gap-2.5">
            <CreditCard className="size-4 mt-0.5 shrink-0 text-[var(--color-warning)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                {invoiceTitle(invoice)}
                <span className="text-muted-foreground">
                  {" "}
                  · paga em {formatDayMonth(invoice.paymentDate)}
                </span>
              </p>
              {invoice.cardLabel && (
                <p className="text-xs text-muted-foreground truncate">
                  {invoice.cardLabel}
                </p>
              )}
              <p className="text-sm mt-1">
                <span className="font-mono">{formatMoney(invoice.amount)}</span>
                {invoice.remainder > 0 && (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span className="font-mono text-[var(--color-warning)]">
                      {formatMoney(invoice.remainder)}
                    </span>
                    <span className="text-muted-foreground"> sem detalhe</span>
                  </>
                )}
              </p>
              {invoice.excess > 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  As compras ligadas somam{" "}
                  <span className="font-mono">{formatMoney(invoice.excess)}</span> a
                  mais que o valor pago. Confira se alguma compra é de outra fatura.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {invoice.purchaseCount > 0
                    ? `${invoice.purchaseCount} ${invoice.purchaseCount === 1 ? "compra detalhada" : "compras detalhadas"}. O resto conta no mês, fora das categorias.`
                    : "Já conta no mês, fora das categorias. O extrato do cartão mostra onde o dinheiro foi."}
                </p>
              )}
            </div>
          </div>
          {showImportCta && invoice.remainder > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={openImport}
              className="min-h-11 self-start text-[var(--color-accent)]"
            >
              <FileUp className="w-4 h-4" />
              Importar extrato do cartão
            </Button>
          )}
        </div>
      ))}

      {unlinkedStatements.map((statement) => (
        <div
          key={statement.batchId}
          className="rounded-lg border border-[var(--color-border)] p-3 flex flex-col gap-2"
        >
          <div className="flex items-start gap-2.5">
            <CreditCard className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                {statement.purchaseCount}{" "}
                {statement.purchaseCount === 1 ? "compra" : "compras"} de cartão sem
                fatura
                <span className="text-muted-foreground">
                  {" "}
                  · <span className="font-mono">{formatMoney(statement.total)}</span>
                </span>
              </p>
              {statement.accountLabel && (
                <p className="text-xs text-muted-foreground truncate">
                  {statement.accountLabel}
                </p>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {invoices.length > 0
                  ? "Contam na data da compra até você dizer qual fatura as pagou."
                  : "Contam na data da compra. Ao importar o pagamento da fatura na conta corrente, passam a contar nele."}
              </p>
            </div>
          </div>
          {invoices.length > 0 && (
            <InvoiceLinkSelect
              batchId={statement.batchId}
              invoiceId={null}
              invoices={invoices}
            />
          )}
        </div>
      ))}
    </section>
  );
}
