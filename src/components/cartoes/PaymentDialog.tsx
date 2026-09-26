import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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
import { EstratoSelect } from "@/components/EstratoSelect";
import { MoneyInput } from "@/components/MoneyInput";
import { useApi } from "@/hooks/useApi";
import { refreshAfterCardChange } from "@/hooks/useCards";
import {
  formatDayMonth,
  isDuplicatePaymentError,
  isoToLocalDate,
  localDateToKey,
} from "@/lib/invoice";
import type { InvoicePayment } from "@/services/api.interface";
import { ACCENT_CTA } from "./shared";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Novo pagamento: numa fatura (`invoiceId`) ou no cartão (fatura pela data). */
  target?: { invoiceId?: string; cardId?: string };
  /** Estrato sugerido para um pagamento novo (o pagador do cartão). */
  defaultBoxId?: string;
  /** Editar um pagamento existente. */
  payment?: InvoicePayment;
};

/**
 * Registra, corrige ou exclui um pagamento de fatura. O pagamento não é gasto
 * por si: ele faz contar as compras que paga, na data dele.
 */
export function PaymentDialog({ open, onOpenChange, target, defaultBoxId, payment }: Props) {
  const { apiService } = useApi();
  const [amount, setAmount] = useState(payment?.amount ?? 0);
  const [date, setDate] = useState<Date | undefined>(
    payment ? isoToLocalDate(payment.date) : new Date(),
  );
  const [boxId, setBoxId] = useState(payment?.boxId ?? defaultBoxId ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Pagamento de mesmo valor já registrado perto dessa data: pode ser o mesmo.
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);

  const close = () => {
    setConfirmingDelete(false);
    setDuplicateOf(null);
    onOpenChange(false);
  };

  const save = async (allowDuplicate = false) => {
    if (!(amount > 0) || !date) {
      toast.error("Informe valor e data do pagamento");
      return;
    }
    setIsSaving(true);
    const result = payment
      ? await apiService.updateInvoicePayment(payment.id, {
          amount,
          date: localDateToKey(date),
          boxId: boxId || undefined,
        })
      : await apiService.addInvoicePayment({
          ...target,
          amount,
          date: localDateToKey(date),
          boxId: boxId || undefined,
          allowDuplicate,
        });
    setIsSaving(false);
    if (result.error) {
      if (!payment && isDuplicatePaymentError(result.error)) {
        const match = /(\d{4}-\d{2}-\d{2})/.exec(result.error);
        setDuplicateOf(match ? formatDayMonth(match[1]) : "");
        return;
      }
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
    close();
  };

  const remove = async () => {
    if (!payment) return;
    setIsSaving(true);
    const result = await apiService.deleteInvoicePayment(payment.id);
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>{payment ? "Pagamento da fatura" : "Novo pagamento"}</DialogTitle>
          <DialogDescription>
            {payment
              ? "Mudar valor ou data muda em que mês as compras pagas por ele contam."
              : "Antecipado ou depois do fechamento. As compras que ele paga passam a contar na data dele."}
          </DialogDescription>
        </DialogHeader>

        {confirmingDelete ? (
          <p className="text-sm text-muted-foreground leading-relaxed py-2">
            As compras que este pagamento pagava voltam a ficar a pagar e saem
            dos gastos do mês dele.
            {payment?.imported &&
              " O lançamento do extrato não volta para a revisão, nem se você importar o arquivo de novo."}
          </p>
        ) : duplicateOf !== null ? (
          <p className="text-sm text-muted-foreground leading-relaxed py-2">
            Já existe um pagamento deste cartão com o mesmo valor
            {duplicateOf ? ` em ${duplicateOf}` : ""}. Se for outro pagamento,
            registre mesmo assim.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Valor</Label>
              <MoneyInput id="payment-amount" value={amount} onChange={setAmount} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <DatePicker date={date} onDateChange={setDate} />
            </div>
            <div className="space-y-2">
              <Label>Saiu do estrato</Label>
              <EstratoSelect value={boxId} onChange={setBoxId} placeholder="Estrato pagador" />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {confirmingDelete ? (
            <>
              <Button variant="outline" disabled={isSaving} onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={isSaving} onClick={() => void remove()}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Excluir pagamento
              </Button>
            </>
          ) : duplicateOf !== null ? (
            <>
              <Button variant="outline" disabled={isSaving} onClick={() => setDuplicateOf(null)}>
                Voltar
              </Button>
              <Button className={ACCENT_CTA} disabled={isSaving} onClick={() => void save(true)}>
                {isSaving && <Loader2 className="animate-spin" />}
                Registrar mesmo assim
              </Button>
            </>
          ) : (
            <>
              {payment && (
                <Button
                  variant="ghost"
                  className="sm:mr-auto text-[var(--color-danger)]"
                  disabled={isSaving}
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 />
                  Excluir
                </Button>
              )}
              <Button variant="outline" disabled={isSaving} onClick={close}>
                Cancelar
              </Button>
              <Button className={ACCENT_CTA} disabled={isSaving} onClick={() => void save()}>
                {isSaving && <Loader2 className="animate-spin" />}
                Salvar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
