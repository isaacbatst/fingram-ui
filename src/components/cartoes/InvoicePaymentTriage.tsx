import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCards, useInvoices } from "@/hooks/useCards";
import {
  formatBRL,
  formatDayMonth,
  invoiceStatusLabel,
  invoiceTitle,
  suggestedTarget,
  type InvoicePaymentTarget,
} from "@/lib/invoice";
import { cn } from "@/lib/utils";
import type { ImportGroupDTO } from "@/services/api.interface";
import { ACCENT_CTA } from "./shared";

type Choice = { target: InvoicePaymentTarget; label: string };

const optionClass = (active: boolean) =>
  cn(
    "min-h-11 px-3 py-2 rounded-md text-sm text-left border transition-colors w-full",
    active
      ? "bg-[var(--color-accent-bg)] text-[var(--color-accent)] border-[var(--color-accent-border)]"
      : "border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)]",
  );

function InvoiceOptions({
  cardId,
  cardName,
  onChoose,
}: {
  cardId: string;
  cardName: string;
  onChoose: (choice: Choice) => void;
}) {
  const { invoices, isLoading } = useInvoices(cardId);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={optionClass(false)}
        onClick={() => onChoose({ target: { cardId }, label: `${cardName} · fatura pela data do pagamento` })}
      >
        Pela data do pagamento
        <span className="block text-xs text-muted-foreground">
          a última fechada ainda não paga, ou a em aberto (antecipação)
        </span>
      </button>
      {isLoading && <Loader2 className="size-4 animate-spin mx-auto text-muted-foreground" />}
      {invoices.slice(0, 6).map((invoice) => (
        <button
          key={invoice.id}
          type="button"
          className={optionClass(false)}
          onClick={() =>
            onChoose({
              target: { cardId, invoiceId: invoice.id },
              label: `${cardName} · ${invoiceTitle(invoice)}`,
            })
          }
        >
          {invoiceTitle(invoice)}
          <span className="block text-xs text-muted-foreground">
            {invoiceStatusLabel(invoice.status)} · vence {formatDayMonth(invoice.dueDate)} ·{" "}
            {formatBRL(invoice.total)}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Triagem do débito "pagamento de fatura" da conta corrente. Não é gasto: é o
 * pagamento que faz as compras do cartão contarem, na data dele. Confirma na
 * hora, no cartão e fatura sugeridos ou nos que o usuário escolher.
 */
export function InvoicePaymentTriage({
  group,
  isBusy,
  onConfirm,
  onNotPayment,
}: {
  group: ImportGroupDTO;
  isBusy: boolean;
  onConfirm: (target: InvoicePaymentTarget) => void;
  onNotPayment: () => void;
}) {
  const { cards } = useCards();
  const suggestion = group.suggestedInvoicePayment;
  const [choice, setChoice] = useState<Choice | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [pickedCardId, setPickedCardId] = useState<string | null>(null);

  const suggestionLabel = suggestion
    ? group.count > 1
      ? `${suggestion.cardName} · cada débito na fatura da sua data`
      : `${suggestion.cardName} · fatura que fecha ${formatDayMonth(suggestion.closingDate)} e vence ${formatDayMonth(suggestion.dueDate)}`
    : null;
  const label = choice?.label ?? suggestionLabel;

  if (choosing) {
    const picked = cards.find((c) => c.id === pickedCardId);
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
          {picked ? `Qual fatura do ${picked.name}?` : "De qual cartão é esta fatura?"}
        </p>
        {picked ? (
          <InvoiceOptions
            cardId={picked.id}
            cardName={picked.name}
            onChoose={(next) => {
              setChoice(next);
              setChoosing(false);
              setPickedCardId(null);
            }}
          />
        ) : (
          cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={optionClass(card.id === (choice?.target.cardId ?? suggestion?.cardId))}
              onClick={() => setPickedCardId(card.id)}
            >
              {card.name}
              <span className="block text-xs text-muted-foreground">
                fecha dia {card.closingDay} · vence dia {card.dueDay}
              </span>
            </button>
          ))
        )}
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          onClick={() => (picked ? setPickedCardId(null) : setChoosing(false))}
        >
          {picked ? "Outro cartão" : "Cancelar"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground leading-relaxed text-center px-2">
        Isto parece o pagamento de uma fatura de cartão. Ele não é gasto por si:
        faz contar as compras que paga, na data dele.
      </p>
      <div className="flex items-center gap-2.5 rounded-md border border-[var(--color-border)] px-3 py-2">
        <CreditCard className="size-4 text-muted-foreground shrink-0" />
        <span className="flex-1 min-w-0 text-sm leading-snug">
          {label ?? (
            <span className="text-muted-foreground">
              Nenhum cartão cadastrado: o Duna cria um “Cartão”, que você
              renomeia depois.
            </span>
          )}
        </span>
        {cards.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 shrink-0 text-[var(--color-accent)]"
            onClick={() => setChoosing(true)}
          >
            Trocar
          </Button>
        )}
      </div>
      <Button
        type="button"
        disabled={isBusy}
        onClick={() => onConfirm(choice?.target ?? suggestedTarget(group))}
        className={ACCENT_CTA}
      >
        {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        Pagamento de fatura
      </Button>
      <Button type="button" variant="ghost" className="min-h-11" onClick={onNotPayment}>
        É um gasto normal
      </Button>
    </div>
  );
}
