import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, FileUp, Loader2, Lock, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/DatePicker";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useApi } from "@/hooks/useApi";
import { useBoxes } from "@/hooks/useBoxes";
import { useCardNav } from "@/hooks/useCardNav";
import {
  refreshAfterCardChange,
  useCards,
  useInvoiceDetail,
  useInvoiceReconcile,
} from "@/hooks/useCards";
import { useCategories } from "@/hooks/useCategories";
import {
  formatBRL,
  formatDayMonth,
  formatPeriod,
  invoiceTitle,
  isoToLocalDate,
  localDateToKey,
  todayKey,
} from "@/lib/invoice";
import { cn } from "@/lib/utils";
import type {
  InvoiceDetail,
  InvoicePayment,
  InvoicePurchase,
  InvoiceReconcile,
  InvoiceView,
} from "@/services/api.interface";
import { PaymentDialog } from "./PaymentDialog";
import { PurchaseDrawer, type EditablePurchase } from "./PurchaseDrawer";
import { ACCENT_CTA, FigureRow, InvoiceStatusBadge, ScreenHeader, SectionTitle } from "./shared";

/** Frase curta que explica o status quando ele pede algo (ou já não pede). */
function statusNote(invoice: InvoiceView): string | null {
  switch (invoice.status) {
    case "open":
      return invoice.closingDate.slice(0, 10) >= todayKey()
        ? `Compras até ${formatDayMonth(invoice.closingDate)} entram nesta fatura.`
        : null;
    case "overdue":
      return invoice.carriedOut > 0
        ? `Venceu com ${formatBRL(invoice.carriedOut)} em aberto, que foi para a fatura seguinte como saldo transferido.`
        : `Venceu em ${formatDayMonth(invoice.dueDate)} com ${formatBRL(invoice.remaining)} em aberto.`;
    case "overpaid":
      return invoice.carriedOut < 0
        ? `Os pagamentos passaram o total em ${formatBRL(invoice.overpaid)}; o excedente virou crédito na fatura seguinte.`
        : `Os pagamentos passaram o total em ${formatBRL(invoice.overpaid)}. Se faltar alguma compra, ela ocupa esse valor quando chegar.`;
    default:
      return null;
  }
}

function PurchaseRow({
  purchase,
  onEdit,
}: {
  purchase: InvoicePurchase;
  onEdit: () => void;
}) {
  const isRefund = purchase.type === "income";
  let status: { text: string; tone?: "warning" | "success" };
  if (isRefund) {
    status = { text: "estorno", tone: "success" };
  } else if (purchase.parts.length === 0) {
    status = { text: "a pagar", tone: "warning" };
  } else {
    const paidOn = purchase.parts
      .map((part) =>
        purchase.parts.length > 1 || purchase.unpaid > 0
          ? `${formatBRL(part.amount)} pago em ${formatDayMonth(part.date)}`
          : `paga em ${formatDayMonth(part.date)}`,
      )
      .join(" · ");
    status =
      purchase.unpaid > 0
        ? { text: `${paidOn} · ${formatBRL(purchase.unpaid)} a pagar`, tone: "warning" }
        : { text: paidOn };
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors active:bg-muted/50 min-h-11"
    >
      <span className="font-mono text-xs text-muted-foreground pt-0.5 w-10 shrink-0">
        {formatDayMonth(purchase.date)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-foreground truncate">
          {purchase.description || "(Sem descrição)"}
        </span>
        <span
          className={cn(
            "block text-xs",
            status.tone === "warning" && "text-[var(--color-warning)]",
            status.tone === "success" && "text-[var(--color-success)]",
            !status.tone && "text-muted-foreground",
          )}
        >
          {status.text}
        </span>
      </span>
      <span
        className={cn(
          "font-mono text-sm whitespace-nowrap",
          isRefund ? "text-[var(--color-success)]" : "text-foreground",
        )}
      >
        {isRefund ? "+ " : ""}
        {formatBRL(purchase.amount)}
      </span>
    </button>
  );
}

function PaymentRow({
  payment,
  invoiceId,
  boxName,
  onEdit,
}: {
  payment: InvoicePayment;
  invoiceId: string;
  boxName?: string;
  onEdit: () => void;
}) {
  const coversPrevious = payment.parts.some((p) => p.purchaseInvoiceId !== invoiceId);
  const notes = [
    boxName,
    payment.imported ? "do extrato" : "lançado à mão",
    payment.parts.length > 0
      ? `cobre ${payment.parts.length} ${payment.parts.length === 1 ? "compra" : "compras"}`
      : null,
    coversPrevious ? "inclui saldo de fatura anterior" : null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors active:bg-muted/50 min-h-11"
    >
      <span className="font-mono text-xs text-muted-foreground pt-0.5 w-10 shrink-0">
        {formatDayMonth(payment.date)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-foreground">Pagamento</span>
        <span className="block text-xs text-muted-foreground">{notes.join(" · ")}</span>
        {payment.notItemized > 0 && (
          <span className="block text-xs text-[var(--color-warning)]">
            {formatBRL(payment.notItemized)} não discriminado
          </span>
        )}
      </span>
      <span className="font-mono text-sm whitespace-nowrap text-foreground">
        {formatBRL(payment.amount)}
      </span>
    </button>
  );
}

const MISSING_REASON: Record<InvoiceReconcile["missing"][number]["reason"], string> = {
  pending: "ainda na revisão do import",
  dismissed: "ignorada na revisão",
  deleted: "excluída depois de confirmada",
  elsewhere: "está em outra fatura",
};

function ReconcileSection({
  reconcile,
  onReviewDuplicates,
}: {
  reconcile: InvoiceReconcile;
  onReviewDuplicates: () => void;
}) {
  const clean =
    reconcile.missing.length === 0 &&
    reconcile.extra.length === 0 &&
    reconcile.duplicates.length === 0 &&
    reconcile.statements.every((s) => s.ledgerMatchesTotal !== false);

  return (
    <section className="mt-6">
      <SectionTitle>Conferência com o extrato</SectionTitle>
      {reconcile.statements.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nenhum extrato do cartão ligado a esta fatura. Importe-o para conferir
          as compras.
        </p>
      ) : (
        <div className="space-y-3">
          {reconcile.statements.map((statement) => (
            <div key={statement.batchId} className="text-sm">
              <div className="text-foreground">
                {statement.fileName ?? statement.accountLabel ?? "Extrato"}
                {formatPeriod(statement.periodStart, statement.periodEnd) && (
                  <span className="text-muted-foreground">
                    {" "}· {formatPeriod(statement.periodStart, statement.periodEnd)}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "text-xs",
                  statement.ledgerMatchesTotal === false
                    ? "text-[var(--color-warning)]"
                    : "text-muted-foreground",
                )}
              >
                {statement.ledgerMatchesTotal === null
                  ? `Compras no extrato: ${formatBRL(statement.statementTotal)}`
                  : statement.ledgerMatchesTotal
                    ? `Saldo do arquivo confere com a fatura (${formatBRL(reconcile.total)})`
                    : `Saldo do arquivo ${formatBRL(Math.abs(statement.ledgerBalance ?? 0))} × fatura ${formatBRL(reconcile.total)}`}
              </div>
            </div>
          ))}

          {clean && (
            <p className="text-xs text-muted-foreground">Tudo confere com o extrato.</p>
          )}

          {reconcile.missing.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Linhas do extrato fora da fatura
              </p>
              <ul className="space-y-1">
                {reconcile.missing.map((line) => (
                  <li key={line.entryId} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">
                        {formatDayMonth(line.date)} · {line.description}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {MISSING_REASON[line.reason]}
                      </span>
                    </span>
                    <span className="font-mono whitespace-nowrap">{formatBRL(line.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reconcile.extra.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Compras lançadas à mão, que o extrato não tem
              </p>
              <ul className="space-y-1">
                {reconcile.extra.map((ref) => (
                  <li key={ref.transactionId} className="flex justify-between gap-3 text-sm">
                    <span className="truncate">
                      {formatDayMonth(ref.date)} · {ref.description}
                    </span>
                    <span className="font-mono whitespace-nowrap">{formatBRL(ref.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reconcile.duplicates.length > 0 && (
            <Button variant="ghost" className="min-h-11 -ml-3 text-[var(--color-accent)]" onClick={onReviewDuplicates}>
              {reconcile.duplicates.length}{" "}
              {reconcile.duplicates.length === 1 ? "possível duplicata" : "possíveis duplicatas"}
              <ChevronRight />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function InvoiceDatesDialog({
  invoice,
  onOpenChange,
}: {
  invoice: InvoiceView;
  onOpenChange: (open: boolean) => void;
}) {
  const { apiService } = useApi();
  const [periodStart, setPeriodStart] = useState<Date | undefined>(isoToLocalDate(invoice.periodStart));
  const [closingDate, setClosingDate] = useState<Date | undefined>(isoToLocalDate(invoice.closingDate));
  const [dueDate, setDueDate] = useState<Date | undefined>(isoToLocalDate(invoice.dueDate));
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!periodStart || !closingDate || !dueDate) return;
    setIsSaving(true);
    const result = await apiService.updateInvoice(invoice.id, {
      periodStart: localDateToKey(periodStart),
      closingDate: localDateToKey(closingDate),
      dueDate: localDateToKey(dueDate),
    });
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datas da fatura</DialogTitle>
          <DialogDescription>
            As compras continuam nesta fatura; mudar as datas não as move.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Início do período</Label>
            <DatePicker date={periodStart} onDateChange={setPeriodStart} />
          </div>
          <div className="space-y-2">
            <Label>Fechamento</Label>
            <DatePicker date={closingDate} onDateChange={setClosingDate} />
          </div>
          <div className="space-y-2">
            <Label>Vencimento</Label>
            <DatePicker date={dueDate} onDateChange={setDueDate} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className={ACCENT_CTA} disabled={isSaving} onClick={() => void save()}>
            {isSaving && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceBody({ detail }: { detail: InvoiceDetail }) {
  const { invoice, purchases, payments } = detail;
  const nav = useCardNav();
  const { apiService } = useApi();
  const { boxes } = useBoxes();
  const { cards } = useCards();
  const { data: reconcile } = useInvoiceReconcile(invoice.id);
  useCategories(); // aquece o cache para a gaveta da compra
  const card = cards.find((c) => c.id === invoice.cardId);
  const [editingDates, setEditingDates] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [payment, setPayment] = useState<InvoicePayment | "new" | null>(null);
  const [purchase, setPurchase] = useState<EditablePurchase | null>(null);

  const boxName = (id: string) => boxes?.find((b) => b.id === id)?.name;
  const note = statusNote(invoice);
  const canCloseNow = invoice.status === "open";

  const closeNow = async () => {
    setIsClosing(true);
    const result = await apiService.closeInvoice(invoice.id, todayKey());
    setIsClosing(false);
    setConfirmClose(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
  };

  return (
    <div className="flex flex-col pb-6">
      <ScreenHeader
        backLabel={invoice.cardName}
        onBack={() => nav.openCard(invoice.cardId)}
        title={invoiceTitle(invoice)}
        subtitle={
          <>
            {formatPeriod(invoice.periodStart, invoice.closingDate)} · fecha{" "}
            {formatDayMonth(invoice.closingDate)} · vence {formatDayMonth(invoice.dueDate)}
          </>
        }
        actions={
          <Button variant="ghost" size="icon" onClick={() => setEditingDates(true)} aria-label="Editar datas da fatura">
            <Pencil className="size-4" />
          </Button>
        }
      />

      <div className="rounded-xl border border-border p-4 duna-surface mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <InvoiceStatusBadge invoice={invoice} />
          {canCloseNow && (
            <Button variant="ghost" size="sm" className="min-h-11 text-muted-foreground" onClick={() => setConfirmClose(true)}>
              <Lock className="size-3.5" />
              Fechar agora
            </Button>
          )}
        </div>
        <dl className="space-y-2">
          <FigureRow label="Compras" value={formatBRL(invoice.purchasesTotal)} />
          {invoice.carriedIn !== 0 && (
            <FigureRow
              label={invoice.carriedIn > 0 ? "Saldo transferido" : "Crédito da fatura anterior"}
              value={formatBRL(invoice.carriedIn)}
              hint={
                invoice.carriedIn > 0
                  ? "O que a fatura anterior deixou em aberto no vencimento."
                  : undefined
              }
            />
          )}
          <FigureRow
            label={invoice.status === "open" ? "Total até agora" : "Total da fatura"}
            value={formatBRL(invoice.total)}
            strong
          />
          <FigureRow label="Pago" value={formatBRL(invoice.paid)} />
          {invoice.remaining > 0 && invoice.status !== "open" && (
            <FigureRow
              label="Falta pagar"
              value={formatBRL(invoice.remaining)}
              tone={invoice.status === "overdue" && invoice.carriedOut === 0 ? "danger" : "warning"}
            />
          )}
          {invoice.overpaid > 0 && (
            <FigureRow label="Pago a mais" value={formatBRL(invoice.overpaid)} tone="warning" />
          )}
          {invoice.unpaidPurchases > 0 && (
            <FigureRow
              label="Compras a pagar"
              value={formatBRL(invoice.unpaidPurchases)}
              tone="muted"
              hint="Ainda não contam nos gastos: entram na data do pagamento que as cobrir."
            />
          )}
          {invoice.notItemized > 0 && (
            <FigureRow
              label="Não discriminado"
              value={formatBRL(invoice.notItemized)}
              tone="warning"
              hint="Parte dos pagamentos sem compra conhecida. Já conta nos gastos, sem categoria, até o extrato do cartão trazer as compras."
            />
          )}
        </dl>
        {note && <p className="text-xs text-muted-foreground leading-relaxed mt-3">{note}</p>}
        {invoice.notItemized > 0 && (
          <Button
            variant="ghost"
            className="min-h-11 -ml-3 mt-1 text-[var(--color-accent)]"
            onClick={nav.openImport}
          >
            <FileUp />
            Importar extrato do cartão
          </Button>
        )}
      </div>

      <section>
        <SectionTitle
          action={
            <Button variant="ghost" size="sm" className="min-h-11 text-[var(--color-accent)]" onClick={() => setPayment("new")}>
              <Plus />
              Pagamento
            </Button>
          }
        >
          Pagamentos
        </SectionTitle>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nenhum pagamento. Ao importar o extrato da conta, o débito da fatura
            entra aqui; também dá para registrar à mão.
          </p>
        ) : (
          <div className="space-y-0.5">
            {payments.map((p) => (
              <PaymentRow
                key={p.id}
                payment={p}
                invoiceId={invoice.id}
                boxName={boxName(p.boxId)}
                onEdit={() => setPayment(p)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <SectionTitle>Compras</SectionTitle>
        {purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nenhuma compra nesta fatura. Elas chegam pelo extrato do cartão.
          </p>
        ) : (
          <div className="space-y-0.5">
            {purchases.map((p) => (
              <PurchaseRow
                key={p.id}
                purchase={p}
                onEdit={() =>
                  setPurchase({
                    id: p.id,
                    description: p.description,
                    amount: p.amount,
                    date: p.date,
                    categoryId: p.categoryId,
                    type: p.type,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {reconcile && (
        <ReconcileSection reconcile={reconcile} onReviewDuplicates={nav.openDuplicates} />
      )}

      {editingDates && <InvoiceDatesDialog invoice={invoice} onOpenChange={setEditingDates} />}

      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar a fatura agora?</DialogTitle>
            <DialogDescription>
              Compras feitas a partir de amanhã entram na próxima fatura.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={isClosing} onClick={() => setConfirmClose(false)}>
              Cancelar
            </Button>
            <Button className={ACCENT_CTA} disabled={isClosing} onClick={() => void closeNow()}>
              {isClosing && <Loader2 className="animate-spin" />}
              Fechar fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {payment !== null && (
        <PaymentDialog
          key={payment === "new" ? "new" : payment.id}
          open
          onOpenChange={(open) => !open && setPayment(null)}
          target={payment === "new" ? { invoiceId: invoice.id } : undefined}
          payment={payment === "new" ? undefined : payment}
          defaultBoxId={card?.boxId}
        />
      )}
      <PurchaseDrawer purchase={purchase} onClose={() => setPurchase(null)} />
    </div>
  );
}

/** Uma fatura: números, pagamentos, compras (com as partes pagas) e conferência. */
export function InvoiceDetailView({ invoiceId, cardId }: { invoiceId: string; cardId: string | null }) {
  const nav = useCardNav();
  const { data, error, isLoading, mutate } = useInvoiceDetail(invoiceId);

  if (isLoading && !data) return <LoadingSpinner />;
  if (error || !data) {
    return (
      <div className="flex flex-col">
        <ScreenHeader
          backLabel={cardId ? "Cartão" : "Estratos"}
          onBack={() => (cardId ? nav.openCard(cardId) : nav.backToEstratos())}
          title="Fatura"
        />
        <ErrorDisplay
          error={error instanceof Error ? error.message : "Erro ao carregar a fatura"}
          onRetry={mutate}
          className="my-4"
        />
      </div>
    );
  }
  return <InvoiceBody detail={data} />;
}
