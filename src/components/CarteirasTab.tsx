import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/MoneyInput";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBoxes } from "@/hooks/useBoxes";
import { useCreateBox } from "@/hooks/useCreateBox";
import { useTransfer } from "@/hooks/useTransfer";
import { useApi } from "@/hooks/useApi";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { format } from "date-fns";
import { PlusIcon, ArrowRightLeftIcon, Wallet, PencilIcon, Trash2Icon } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorDisplay } from "./ErrorDisplay";
import type { BoxDTO, BoxType } from "@/services/api.interface";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const boxTypeLabel = (type: BoxType) => (type === "spending" ? "Conta" : "Caixinha");

const getISODateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export function CarteirasTab() {
  const { boxes, isLoading, error, mutate: mutateBoxes } = useBoxes();
  const { createBox } = useCreateBox();
  const { createTransfer } = useTransfer();
  const { apiService } = useApi();
  const { mutate } = useSWRConfig();

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createGoalAmount, setCreateGoalAmount] = useState(0);
  const [createType, setCreateType] = useState<BoxType>("spending");
  const [isCreating, setIsCreating] = useState(false);

  // Detail drawer state
  const [selectedBox, setSelectedBox] = useState<BoxDTO | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit state (used inside drawer)
  const [editName, setEditName] = useState("");
  const [editGoalAmount, setEditGoalAmount] = useState(0);
  const [editType, setEditType] = useState<BoxType>("spending");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingBox, setDeletingBox] = useState<BoxDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Transfer dialog state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFromBoxId, setTransferFromBoxId] = useState("");
  const [transferToBoxId, setTransferToBoxId] = useState("");
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferDate, setTransferDate] = useState<Date | undefined>(new Date());
  const [isTransferring, setIsTransferring] = useState(false);

  // --- Handlers ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createName.trim()) {
      toast.error("Por favor, insira um nome");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createBox({
        name: createName.trim(),
        goalAmount: createGoalAmount > 0 ? createGoalAmount : undefined,
        type: createType,
      });

      if (result) {
        setIsCreateOpen(false);
        setCreateName("");
        setCreateGoalAmount(0);
        setCreateType("spending");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDetail = (box: BoxDTO) => {
    setSelectedBox(box);
    setIsEditMode(false);
    setIsDrawerOpen(true);
  };

  const handleEnterEditMode = () => {
    if (!selectedBox) return;
    setEditName(selectedBox.name);
    setEditGoalAmount(selectedBox.goalAmount ?? 0);
    setEditType(selectedBox.type);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBox) return;

    if (!editName.trim()) {
      toast.error("Por favor, insira um nome");
      return;
    }

    setIsSavingEdit(true);
    try {
      const result = await apiService.editBox({
        boxId: selectedBox.id,
        name: editName.trim(),
        goalAmount: editGoalAmount > 0 ? editGoalAmount : null,
        type: editType,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Carteira atualizada com sucesso");
        mutate("boxes");
        mutate("summary");
        mutate((key: unknown) => typeof key === 'string' ? key.startsWith("budget-summary") : false);
        setIsDrawerOpen(false);
        setSelectedBox(null);
        setIsEditMode(false);
      }
    } catch (err) {
      console.error("Error editing box:", err);
      toast.error("Erro ao atualizar carteira");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenDelete = (box: BoxDTO) => {
    setDeletingBox(box);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBox) return;

    setIsDeleting(true);
    try {
      const result = await apiService.deleteBox(deletingBox.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Carteira removida com sucesso");
        mutate("boxes");
        mutate("summary");
        mutate((key: unknown) => typeof key === 'string' ? key.startsWith("budget-summary") : false);
        setIsDeleteOpen(false);
        setDeletingBox(null);
        setIsDrawerOpen(false);
        setSelectedBox(null);
      }
    } catch (err) {
      console.error("Error deleting box:", err);
      toast.error("Erro ao remover carteira");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transferFromBoxId || !transferToBoxId) {
      toast.error("Selecione as carteiras de origem e destino");
      return;
    }

    if (transferFromBoxId === transferToBoxId) {
      toast.error("As carteiras de origem e destino devem ser diferentes");
      return;
    }

    if (!transferAmount || transferAmount <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    if (!transferDate) {
      toast.error("Por favor, selecione uma data");
      return;
    }

    setIsTransferring(true);
    try {
      const result = await createTransfer({
        fromBoxId: transferFromBoxId,
        toBoxId: transferToBoxId,
        amount: transferAmount,
        date: getISODateString(transferDate),
      });

      if (result) {
        setIsTransferOpen(false);
        setTransferFromBoxId("");
        setTransferToBoxId("");
        setTransferAmount(0);
        setTransferDate(new Date());
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const canDeleteBox = (box: BoxDTO): boolean => {
    if (box.isDefault) return false;
    if (box.balance !== 0) return false;
    return true;
  };

  const getDeleteDisabledReason = (box: BoxDTO): string | undefined => {
    if (box.isDefault) return "Carteira padrão não pode ser removida";
    if (box.balance !== 0) return "Carteira com saldo não pode ser removida";
    return undefined;
  };

  // --- Render ---

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        onRetry={mutateBoxes}
        className="my-4"
      />
    );
  }

  const spendingBoxes = boxes?.filter((b) => b.type === "spending") ?? [];
  const savingBoxes = boxes?.filter((b) => b.type === "saving") ?? [];
  const totalBalance = boxes?.reduce((sum, b) => sum + b.balance, 0) ?? 0;

  const renderBoxCard = (box: BoxDTO, index: number) => (
    <button
      key={box.id}
      type="button"
      className={`w-full text-left rounded-xl border border-border p-4 duna-card duna-surface duna-stagger-${Math.min(index + 1, 6)} transition-colors active:bg-muted/50`}
      onClick={() => handleOpenDetail(box)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-display text-base text-foreground tracking-tight">
          {box.name}
        </span>
        {box.isDefault && (
          <span className="text-[9px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
            padrão
          </span>
        )}
      </div>

      <div className="text-xl font-bold text-foreground font-mono tracking-tight">
        {formatCurrency(box.balance)}
      </div>

      {box.goalAmount != null && box.goalProgress != null && (
        <div className="mt-3">
          <div className="flex justify-between items-center gap-2">
            <Progress
              value={Math.min(100, box.goalProgress)}
              filledColor={box.goalProgress >= 100 ? "var(--color-success)" : "var(--color-accent)"}
              bgColor="var(--color-border)"
              className="h-2 flex-1"
            />
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {Math.min(100, Math.round(box.goalProgress))}%
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Meta: {formatCurrency(box.goalAmount)}
          </div>
        </div>
      )}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-tight">Carteiras</h2>
            <p className="text-lg font-mono text-foreground mt-0.5">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransferOpen(true)}
            >
              <ArrowRightLeftIcon className="h-4 w-4 mr-1" />
              Transferir
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>
        </div>
      </div>

      {/* Box List */}
      <ScrollArea className="flex flex-col flex-1 pr-3 overflow-y-auto">
        {boxes && boxes.length > 0 ? (
          <div className="space-y-6">
            {spendingBoxes.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Contas
                </h3>
                <div className="space-y-2">
                  {spendingBoxes.map(renderBoxCard)}
                </div>
              </div>
            )}
            {savingBoxes.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Caixinhas
                </h3>
                <div className="space-y-2">
                  {savingBoxes.map(renderBoxCard)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <Wallet className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2 tracking-tight">
              Nenhuma carteira
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              Crie uma nova carteira para organizar suas finanças.
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Detail Drawer (bottom sheet) */}
      <Drawer open={isDrawerOpen} onOpenChange={(open) => {
        setIsDrawerOpen(open);
        if (!open) {
          setIsEditMode(false);
          setSelectedBox(null);
        }
      }}>
        <DrawerContent>
          {selectedBox && !isEditMode && (
            <>
              <DrawerHeader>
                <DrawerTitle className="font-display text-xl tracking-tight">
                  {selectedBox.name}
                </DrawerTitle>
                <DrawerDescription>
                  {boxTypeLabel(selectedBox.type)}
                  {selectedBox.isDefault && " · Padrão"}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-2">
                <div className="text-2xl font-bold text-foreground font-mono tracking-tight mb-4">
                  {formatCurrency(selectedBox.balance)}
                </div>

                {selectedBox.goalAmount != null && selectedBox.goalProgress != null && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <Progress
                        value={Math.min(100, selectedBox.goalProgress)}
                        filledColor={selectedBox.goalProgress >= 100 ? "var(--color-success)" : "var(--color-accent)"}
                        bgColor="var(--color-border)"
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {Math.min(100, Math.round(selectedBox.goalProgress))}%
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Meta: {formatCurrency(selectedBox.goalAmount)}
                    </div>
                  </div>
                )}
              </div>

              <DrawerFooter>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleEnterEditMode}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!canDeleteBox(selectedBox)}
                    title={getDeleteDisabledReason(selectedBox) || "Remover"}
                    onClick={() => handleOpenDelete(selectedBox)}
                  >
                    <Trash2Icon className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}

          {selectedBox && isEditMode && (
            <>
              <DrawerHeader>
                <DrawerTitle className="font-display text-xl tracking-tight">
                  Editar {boxTypeLabel(editType)}
                </DrawerTitle>
                <DrawerDescription>
                  Altere as propriedades da {boxTypeLabel(editType).toLowerCase()}.
                </DrawerDescription>
              </DrawerHeader>

              <form onSubmit={handleSaveEdit} className="flex flex-col flex-1">
                <div className="space-y-4 px-4 pb-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={editType}
                      onValueChange={(v) => setEditType(v as BoxType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spending">Conta</SelectItem>
                        <SelectItem value="saving">Caixinha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome</Label>
                    <Input
                      id="edit-name"
                      placeholder="Nome"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  {editType === "saving" && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-goal">Meta (opcional)</Label>
                      <MoneyInput
                        id="edit-goal"
                        value={editGoalAmount}
                        onChange={setEditGoalAmount}
                      />
                    </div>
                  )}
                </div>

                <DrawerFooter>
                  <div className="flex gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancelEdit}
                      disabled={isSavingEdit}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSavingEdit}>
                      {isSavingEdit ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </DrawerFooter>
              </form>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover carteira</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a carteira &quot;{deletingBox?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Box Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Carteira</DialogTitle>
            <DialogDescription>
              Crie uma nova carteira para organizar seus recursos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={createType}
                  onValueChange={(v) => setCreateType(v as BoxType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spending">Conta</SelectItem>
                    <SelectItem value="saving">Caixinha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome</Label>
                <Input
                  id="create-name"
                  placeholder={createType === "spending" ? "Ex: Nubank" : "Ex: Reserva de emergencia"}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                />
              </div>
              {createType === "saving" && (
                <div className="space-y-2">
                  <Label htmlFor="create-goal">Meta (opcional)</Label>
                  <MoneyInput
                    id="create-goal"
                    value={createGoalAmount}
                    onChange={setCreateGoalAmount}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir entre carteiras</DialogTitle>
            <DialogDescription>
              Transfira recursos de uma carteira para outra.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transfer-from">Origem</Label>
                <Select
                  value={transferFromBoxId}
                  onValueChange={setTransferFromBoxId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a carteira de origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes?.map((box) => (
                      <SelectItem key={box.id} value={box.id}>
                        {box.name} ({formatCurrency(box.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-to">Destino</Label>
                <Select
                  value={transferToBoxId}
                  onValueChange={setTransferToBoxId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a carteira de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes?.map((box) => (
                      <SelectItem key={box.id} value={box.id}>
                        {box.name} ({formatCurrency(box.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Valor (R$)</Label>
                <MoneyInput
                  id="transfer-amount"
                  value={transferAmount}
                  onChange={setTransferAmount}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <DatePicker
                  date={transferDate}
                  onDateChange={setTransferDate}
                  placeholder="Selecione uma data"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransferOpen(false)}
                disabled={isTransferring}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isTransferring}>
                {isTransferring ? "Transferindo..." : "Transferir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
