import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CategorySelect } from "@/components/CategorySelect";
import { DatePicker } from "@/components/DatePicker";
import { MoneyInput } from "@/components/MoneyInput";
import { useApi } from "@/hooks/useApi";
import { refreshAfterCardChange } from "@/hooks/useCards";
import { useCategories } from "@/hooks/useCategories";
import { isoToLocalDate, localDateToKey } from "@/lib/invoice";
import { ACCENT_CTA } from "./shared";

/** O que é preciso para editar uma compra de cartão. */
export type EditablePurchase = {
  id: string;
  description: string;
  amount: number;
  /** Data da compra (não a do pagamento). */
  date: string;
  categoryId: string | null;
  type: "expense" | "income";
};

type Props = {
  purchase: EditablePurchase | null;
  onClose: () => void;
};

/**
 * Edita ou exclui uma compra de cartão. As partes que os pagamentos pagam
 * dela são recalculadas pelo servidor: por isso a edição é sempre na compra,
 * nunca numa parte. O estrato não aparece — ele é o pagador do cartão.
 */
export function PurchaseDrawer({ purchase, onClose }: Props) {
  return (
    <Drawer open={purchase !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {purchase && <PurchaseForm key={purchase.id} purchase={purchase} onClose={onClose} />}
      </DrawerContent>
    </Drawer>
  );
}

function PurchaseForm({ purchase, onClose }: { purchase: EditablePurchase; onClose: () => void }) {
  const { apiService } = useApi();
  const { data: categories = [] } = useCategories();
  const [description, setDescription] = useState(purchase.description);
  const [amount, setAmount] = useState(purchase.amount);
  const [date, setDate] = useState<Date | undefined>(isoToLocalDate(purchase.date));
  const [categoryCode, setCategoryCode] = useState(
    categories.find((c) => c.id === purchase.categoryId)?.code ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const options = categories
    .filter((c) => c.transactionType === "both" || c.transactionType === purchase.type)
    .map((c) => ({ label: c.name, value: c.code, type: c.transactionType }));

  // A categoria chega depois do primeiro render quando as categorias ainda carregam.
  const currentCode =
    categoryCode || categories.find((c) => c.id === purchase.categoryId)?.code || "";

  const save = async () => {
    if (!(amount > 0) || !date) {
      toast.error("Informe valor e data da compra");
      return;
    }
    setIsSaving(true);
    const result = await apiService.editTransaction({
      transactionId: purchase.id,
      newAmount: amount,
      newDate: localDateToKey(date),
      newCategory: currentCode || undefined,
      newDescription: description.trim() || undefined,
    });
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
    onClose();
  };

  const remove = async () => {
    setIsSaving(true);
    const result = await apiService.deleteTransaction(purchase.id);
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refreshAfterCardChange();
    onClose();
  };

  if (confirmingDelete) {
    return (
      <>
        <DrawerHeader>
          <DrawerTitle className="font-display text-xl tracking-tight">Excluir a compra?</DrawerTitle>
          <DrawerDescription>
            A compra inteira sai da fatura, com todas as partes já pagas. O que
            os pagamentos pagavam dela passa a cobrir a próxima compra da fila
            ou fica não discriminado.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" disabled={isSaving} onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" variant="destructive" disabled={isSaving} onClick={() => void remove()}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Excluir compra
            </Button>
          </div>
        </DrawerFooter>
      </>
    );
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="font-display text-xl tracking-tight">
          {purchase.type === "income" ? "Estorno no cartão" : "Compra no cartão"}
        </DrawerTitle>
        <DrawerDescription>
          Ela conta nos gastos na data do pagamento que a paga. Aqui você corrige
          a compra; as partes pagas se ajustam sozinhas.
        </DrawerDescription>
      </DrawerHeader>
      <div className="px-4 space-y-3 pb-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block" htmlFor="purchase-description">
            Descrição
          </label>
          <Input
            id="purchase-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block" htmlFor="purchase-amount">
            Valor da compra
          </label>
          <MoneyInput id="purchase-amount" value={amount} onChange={setAmount} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Data da compra</label>
          <DatePicker date={date} onDateChange={setDate} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
          <CategorySelect
            categories={options}
            value={currentCode}
            onChange={setCategoryCode}
            currentTransactionType={purchase.type}
          />
        </div>
      </div>
      <DrawerFooter>
        <div className="flex gap-2">
          <Button
            className="flex-1 text-[var(--color-danger)]"
            variant="ghost"
            disabled={isSaving}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 />
            Excluir
          </Button>
          <Button className={`flex-1 ${ACCENT_CTA}`} disabled={isSaving} onClick={() => void save()}>
            {isSaving && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </div>
      </DrawerFooter>
    </>
  );
}
