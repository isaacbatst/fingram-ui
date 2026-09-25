import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstratoSelect } from "@/components/EstratoSelect";
import { useApi } from "@/hooks/useApi";
import { useBoxes } from "@/hooks/useBoxes";
import { refreshAfterCardChange } from "@/hooks/useCards";
import type { CardView } from "@/services/api.interface";
import { ACCENT_CTA } from "./shared";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editar um cartão existente; sem ele, cria. */
  card?: CardView;
  /** Só sem compras nem pagamentos (a API recusa o resto). */
  canDelete?: boolean;
  onCreated?: (card: CardView) => void;
  onDeleted?: () => void;
};

const parseDay = (value: string): number | null => {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
};

export function CardFormDialog({ open, onOpenChange, card, canDelete, onCreated, onDeleted }: Props) {
  const { apiService } = useApi();
  const { boxes } = useBoxes();
  const defaultBoxId = boxes?.find((b) => b.isDefault)?.id ?? "";
  const [name, setName] = useState(card?.name ?? "");
  const [closingDay, setClosingDay] = useState(card ? String(card.closingDay) : "");
  const [dueDay, setDueDay] = useState(card ? String(card.dueDay) : "");
  const [boxId, setBoxId] = useState(card?.boxId ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const closing = parseDay(closingDay);
    const due = parseDay(dueDay);
    if (!name.trim()) {
      toast.error("Dê um nome ao cartão");
      return;
    }
    if (closing === null || due === null) {
      toast.error("Os dias de fechamento e vencimento vão de 1 a 31");
      return;
    }
    setIsSaving(true);
    const request = {
      name: name.trim(),
      closingDay: closing,
      dueDay: due,
      boxId: boxId || undefined,
    };
    const result = card
      ? await apiService.updateCard(card.id, request)
      : await apiService.createCard(request);
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
    onOpenChange(false);
    if (!card && result.data) onCreated?.(result.data);
  };

  const remove = async () => {
    if (!card) return;
    setIsSaving(true);
    const result = await apiService.deleteCard(card.id);
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    // Sai da tela do cartão antes de revalidar: ela pediria as faturas de um
    // cartão que já não existe.
    onOpenChange(false);
    onDeleted?.();
    await refreshAfterCardChange();
  };

  const boxChanged = card && boxId && boxId !== card.boxId;
  const daysChanged =
    card && (closingDay !== String(card.closingDay) || dueDay !== String(card.dueDay));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>{card ? "Editar cartão" : "Novo cartão"}</DialogTitle>
          <DialogDescription>
            {card
              ? "Nome, dias da fatura e o estrato que paga."
              : "O cartão também aparece sozinho quando você importa o extrato dele."}
          </DialogDescription>
        </DialogHeader>

        {confirmingDelete ? (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed py-2">
              O cartão e as faturas vazias dele saem do Duna.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" disabled={isSaving} onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={isSaving} onClick={() => void remove()}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Excluir cartão
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={save}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="card-name">Nome</Label>
                <Input
                  id="card-name"
                  placeholder="Ex: Nubank"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="card-closing">Fecha no dia</Label>
                  <Input
                    id="card-closing"
                    inputMode="numeric"
                    type="number"
                    min={1}
                    max={31}
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-due">Vence no dia</Label>
                  <Input
                    id="card-due"
                    inputMode="numeric"
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                  />
                </div>
              </div>
              {daysChanged && (
                <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                  Os dias novos valem para as próximas faturas. As que já existem
                  mantêm as datas; ajuste-as na própria fatura, se preciso.
                </p>
              )}
              <div className="space-y-2">
                <Label>Estrato que paga a fatura</Label>
                <EstratoSelect
                  value={boxId || (card ? "" : defaultBoxId)}
                  onChange={setBoxId}
                  placeholder="Estrato padrão"
                />
                {boxChanged && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    As compras passam para o novo estrato. Pagamentos já feitos
                    continuam no estrato de onde saíram.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              {card && canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="sm:mr-auto text-[var(--color-danger)]"
                  disabled={isSaving}
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 />
                  Excluir
                </Button>
              )}
              <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className={ACCENT_CTA} disabled={isSaving}>
                {isSaving && <Loader2 className="animate-spin" />}
                {card ? "Salvar" : "Criar cartão"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
