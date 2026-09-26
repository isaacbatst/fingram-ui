import type { ReactNode } from "react";
import { ChevronRight, CreditCard } from "lucide-react";
import { useCardNav } from "@/hooks/useCardNav";
import { useCards, useDuplicates, useInvoices } from "@/hooks/useCards";
import {
  buildCardNotices,
  formatBRL,
  formatDayMonth,
  invoiceTitle,
  type CardNotice,
} from "@/lib/invoice";
import { cn } from "@/lib/utils";

function NoticeRow({
  tone,
  children,
  onClick,
}: {
  tone: "warning" | "danger" | "muted";
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 min-h-11 px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-surface-hover)]/40 active:bg-[var(--color-bg-surface-hover)]"
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          tone === "danger" && "bg-[var(--color-danger)]",
          tone === "warning" && "bg-[var(--color-warning)]",
          tone === "muted" && "bg-muted-foreground/50",
        )}
      />
      <span className="flex-1 min-w-0 text-sm leading-snug">{children}</span>
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </button>
  );
}

/**
 * O que, nos cartões, pede atenção — no topo de Gastos, porque é o que muda os
 * números daqui: não discriminado já conta sem categoria; compras a pagar
 * ainda não contam. Some quando não há nada.
 */
export function CartoesAviso() {
  const nav = useCardNav();
  const { cards } = useCards();
  const { invoices, pendingStatements } = useInvoices();
  const { pairs } = useDuplicates();

  const notices = buildCardNotices({
    invoices,
    cards,
    pendingStatements,
    duplicateCount: pairs.length,
  });
  if (notices.length === 0) return null;

  const render = (notice: CardNotice) => {
    switch (notice.kind) {
      case "overdue":
        return (
          <NoticeRow key={`od-${notice.invoice.id}`} tone="danger" onClick={() => nav.openInvoice(notice.invoice.id, notice.invoice.cardId)}>
            {invoiceTitle(notice.invoice)} · {notice.invoice.cardName}{" "}
            <span className="text-muted-foreground">
              venceu {formatDayMonth(notice.invoice.dueDate)} com{" "}
              <span className="font-mono">{formatBRL(notice.invoice.remaining)}</span> em aberto
            </span>
          </NoticeRow>
        );
      case "notItemized":
        return (
          <NoticeRow key={`ni-${notice.invoice.id}`} tone="warning" onClick={() => nav.openInvoice(notice.invoice.id, notice.invoice.cardId)}>
            <span className="font-mono">{formatBRL(notice.invoice.notItemized)}</span>{" "}
            não discriminado · {notice.invoice.cardName}{" "}
            <span className="text-muted-foreground">
              — já conta, sem categoria, até chegar o extrato do cartão
            </span>
          </NoticeRow>
        );
      case "overpaid":
        return (
          <NoticeRow key={`op-${notice.invoice.id}`} tone="warning" onClick={() => nav.openInvoice(notice.invoice.id, notice.invoice.cardId)}>
            {invoiceTitle(notice.invoice)} · {notice.invoice.cardName}{" "}
            <span className="text-muted-foreground">
              paga a mais em <span className="font-mono">{formatBRL(notice.invoice.overpaid)}</span>
            </span>
          </NoticeRow>
        );
      case "duplicates":
        return (
          <NoticeRow key="dup" tone="warning" onClick={nav.openDuplicates}>
            {notice.count} {notice.count === 1 ? "possível duplicata" : "possíveis duplicatas"}{" "}
            <span className="text-muted-foreground">entre lançamentos à mão e o extrato do cartão</span>
          </NoticeRow>
        );
      case "pendingStatements":
        return (
          <NoticeRow key="pending" tone="muted" onClick={nav.openReprocess}>
            {notice.count}{" "}
            {notice.count === 1 ? "extrato de cartão antigo" : "extratos de cartão antigos"}{" "}
            <span className="text-muted-foreground">ainda contam na data da compra — reprocessar</span>
          </NoticeRow>
        );
      case "payable":
        return (
          <NoticeRow
            key="payable"
            tone="muted"
            onClick={() => (cards.length === 1 ? nav.openCard(cards[0].id) : nav.openCards())}
          >
            <span className="font-mono">{formatBRL(notice.amount)}</span> a pagar no cartão{" "}
            <span className="text-muted-foreground">— entra nos gastos quando a fatura for paga</span>
          </NoticeRow>
        );
    }
  };

  return (
    <section
      aria-label="Cartões"
      className="rounded-lg border border-[var(--color-border)] mb-5 overflow-hidden divide-y divide-[var(--color-border-subtle)]"
    >
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
        <CreditCard className="size-3.5" />
        Cartões
      </div>
      {notices.map(render)}
    </section>
  );
}
