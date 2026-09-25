import { useState } from "react";
import { ChevronRight, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useBoxes } from "@/hooks/useBoxes";
import { useCardNav } from "@/hooks/useCardNav";
import { useCards, useInvoices } from "@/hooks/useCards";
import {
  canDeleteCard,
  formatBRL,
  formatDayMonth,
  invoiceTitle,
  todayKey,
} from "@/lib/invoice";
import type { InvoiceView } from "@/services/api.interface";
import { CardFormDialog } from "./CardFormDialog";
import { PaymentDialog } from "./PaymentDialog";
import { ACCENT_CTA, FigureRow, InvoiceStatusBadge, ScreenHeader, SectionTitle } from "./shared";

/** Uma linha da lista de faturas: o que importa depende do status. */
function InvoiceRow({ invoice, onOpen }: { invoice: InvoiceView; onOpen: () => void }) {
  const isOpen = invoice.status === "open";
  const closesInFuture = invoice.closingDate.slice(0, 10) >= todayKey();
  const details: string[] = [];
  if (isOpen) {
    details.push(
      closesInFuture
        ? `fecha ${formatDayMonth(invoice.closingDate)}`
        : `fechou ${formatDayMonth(invoice.closingDate)}`,
    );
    if (invoice.paid > 0) details.push(`${formatBRL(invoice.paid)} antecipado`);
  } else {
    details.push(`vence ${formatDayMonth(invoice.dueDate)}`);
    if (invoice.paid > 0) details.push(`pago ${formatBRL(invoice.paid)}`);
    if (invoice.status === "overdue" && invoice.carriedOut > 0) {
      details.push(`${formatBRL(invoice.carriedOut)} foi para a seguinte`);
    } else if (invoice.remaining > 0) {
      details.push(`falta ${formatBRL(invoice.remaining)}`);
    }
    if (invoice.overpaid > 0) details.push(`${formatBRL(invoice.overpaid)} a mais`);
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-lg border border-border p-3 duna-surface flex items-center gap-3 min-h-11 transition-colors active:bg-muted/50"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground truncate">{invoiceTitle(invoice)}</span>
          <InvoiceStatusBadge invoice={invoice} />
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {details.join(" · ")}
        </div>
        {invoice.carriedIn !== 0 && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {invoice.carriedIn > 0
              ? `inclui ${formatBRL(invoice.carriedIn)} de saldo transferido`
              : `${formatBRL(-invoice.carriedIn)} de crédito da fatura anterior`}
          </div>
        )}
        {invoice.notItemized > 0 && (
          <div className="text-xs text-[var(--color-warning)] mt-0.5">
            {formatBRL(invoice.notItemized)} não discriminado
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono text-sm text-foreground">{formatBRL(invoice.total)}</div>
        {isOpen && <div className="text-[10px] text-muted-foreground">até agora</div>}
      </div>
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </button>
  );
}

/** Um cartão: dados, o que está a pagar e as faturas (ciclos), da mais nova à mais antiga. */
export function CardView({ cardId }: { cardId: string }) {
  const nav = useCardNav();
  const { cards, isLoading: loadingCards, error: cardsError, mutate } = useCards();
  const { invoices, isLoading: loadingInvoices } = useInvoices(cardId);
  const { boxes } = useBoxes();
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);

  const card = cards.find((c) => c.id === cardId);

  if (loadingCards || (loadingInvoices && invoices.length === 0 && !card)) {
    return <LoadingSpinner />;
  }
  if (cardsError) {
    return <ErrorDisplay error="Erro ao carregar o cartão" onRetry={mutate} className="my-4" />;
  }
  if (!card) {
    return (
      <div className="flex flex-col">
        <ScreenHeader backLabel="Estratos" onBack={nav.backToEstratos} title="Cartão" />
        <p className="text-sm text-muted-foreground py-6 text-center">Cartão não encontrado.</p>
      </div>
    );
  }

  const boxName = boxes?.find((b) => b.id === card.boxId)?.name;

  return (
    <div className="flex flex-col pb-6">
      <ScreenHeader
        backLabel="Estratos"
        onBack={nav.backToEstratos}
        title={card.name}
        subtitle={
          <>
            Fecha dia {card.closingDay} · vence dia {card.dueDay}
            {boxName && ` · pago por ${boxName}`}
          </>
        }
        actions={
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Editar cartão">
            <Pencil className="size-4" />
          </Button>
        }
      />

      <dl className="rounded-xl border border-border p-4 duna-surface space-y-2 mb-4">
        <FigureRow
          label="A pagar"
          value={formatBRL(card.payable)}
          strong
          hint="Compras ainda não pagas. Entram nos gastos quando um pagamento as cobre, na data dele."
        />
      </dl>

      <Button className={`${ACCENT_CTA} mb-6`} onClick={() => setPaying(true)}>
        <Plus />
        Registrar pagamento
      </Button>

      <SectionTitle>Faturas</SectionTitle>
      {loadingInvoices && invoices.length === 0 ? (
        <LoadingSpinner />
      ) : invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nenhuma fatura ainda. Ela aparece ao importar o extrato do cartão ou ao
          registrar um pagamento.
        </p>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              onOpen={() => nav.openInvoice(invoice.id, card.id)}
            />
          ))}
        </div>
      )}

      {editing && (
        <CardFormDialog
          open
          onOpenChange={setEditing}
          card={card}
          canDelete={canDeleteCard(card.id, invoices)}
          onDeleted={nav.backToEstratos}
        />
      )}
      {paying && (
        <PaymentDialog
          open
          onOpenChange={setPaying}
          target={{ cardId: card.id }}
          defaultBoxId={card.boxId}
        />
      )}
    </div>
  );
}
