import { useState } from "react";
import { ChevronRight, CreditCard, History, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBoxes } from "@/hooks/useBoxes";
import { useCardNav } from "@/hooks/useCardNav";
import { useCards, useDuplicates, useInvoices } from "@/hooks/useCards";
import { formatBRL, formatDayMonth, openInvoiceOf } from "@/lib/invoice";
import type { CardView } from "@/services/api.interface";
import { CardFormDialog } from "./CardFormDialog";

/**
 * Cartões na aba Estratos. O cartão não é estrato (não guarda dinheiro), mas
 * é pago por um: aqui fica perto do saldo que ele consome.
 */
export function CartoesSection() {
  const nav = useCardNav();
  const { cards, isLoading } = useCards();
  const { invoices, pendingStatements } = useInvoices();
  const { pairs } = useDuplicates();
  const { boxes } = useBoxes();
  const [creating, setCreating] = useState(false);

  if (isLoading && cards.length === 0) return null;

  const renderCard = (card: CardView) => {
    const open = openInvoiceOf(card, invoices);
    const boxName = boxes?.find((b) => b.id === card.boxId)?.name;
    return (
      <button
        key={card.id}
        type="button"
        onClick={() => nav.openCard(card.id)}
        className="w-full text-left rounded-xl border border-border p-4 duna-card duna-surface transition-colors active:bg-muted/50 flex items-center gap-3"
      >
        <CreditCard className="size-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display tracking-tight text-base text-foreground truncate">
            {card.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {open
              ? `Fatura atual ${formatBRL(open.total)} · fecha ${formatDayMonth(open.closingDate)}`
              : `Fecha dia ${card.closingDay} · vence dia ${card.dueDay}`}
          </div>
          {boxName && (
            <div className="text-[11px] text-muted-foreground/80">pago por {boxName}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm text-foreground">{formatBRL(card.payable)}</div>
          <div className="text-[10px] text-muted-foreground">a pagar</div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </button>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Cartões
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={() => setCreating(true)}
          aria-label="Novo cartão"
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>

      {cards.length === 0 ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Nenhum cartão. Ele aparece sozinho quando você importa o extrato do
          cartão, ou adicione pelo +.
        </p>
      ) : (
        <div className="space-y-2">{cards.map(renderCard)}</div>
      )}

      {(pairs.length > 0 || pendingStatements.length > 0 || cards.length > 0) && (
        <div className="mt-3 flex flex-col">
          {pairs.length > 0 && (
            <Button
              variant="ghost"
              className="justify-between min-h-11 px-2 text-sm"
              onClick={nav.openDuplicates}
            >
              <span className="text-[var(--color-warning)]">
                {pairs.length} {pairs.length === 1 ? "possível duplicata" : "possíveis duplicatas"}
              </span>
              <ChevronRight className="text-muted-foreground" />
            </Button>
          )}
          <Button
            variant="ghost"
            className="justify-between min-h-11 px-2 text-sm h-auto py-2"
            onClick={nav.openReprocess}
          >
            <span className="flex items-center gap-2 text-left whitespace-normal">
              <History className="size-4 text-muted-foreground shrink-0" />
              <span>
                <span className="block text-foreground">Reprocessar histórico</span>
                {pendingStatements.length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {pendingStatements.length}{" "}
                    {pendingStatements.length === 1
                      ? "extrato de cartão antigo ainda conta"
                      : "extratos de cartão antigos ainda contam"}{" "}
                    na data da compra
                  </span>
                )}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground" />
          </Button>
        </div>
      )}

      {creating && (
        <CardFormDialog open onOpenChange={setCreating} onCreated={(card) => nav.openCard(card.id)} />
      )}
    </div>
  );
}
