import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBoxes } from "@/hooks/useBoxes";
import { useCreateBox } from "@/hooks/useCreateBox";
import { useTransfer } from "@/hooks/useTransfer";
import { useApi } from "@/hooks/useApi";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { format } from "date-fns";
import { PencilIcon, Trash2Icon, PlusIcon, ArrowRightLeftIcon } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorDisplay } from "./ErrorDisplay";
import type { BoxDTO } from "@/services/api.interface";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getISODateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export function CaixinhasTab() {
  const { boxes, isLoading, error, mutate: mutateBoxes } = useBoxes();
  const { createBox } = useCreateBox();
  const { createTransfer } = useTransfer();
  const { apiService } = useApi();
  const { mutate } = useSWRConfig();

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createGoalAmount, setCreateGoalAmount] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<BoxDTO | null>(null);
  const [editName, setEditName] = useState("");
  const [editGoalAmount, setEditGoalAmount] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingBox, setDeletingBox] = useState<BoxDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Transfer dialog state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFromBoxId, setTransferFromBoxId] = useState("");
  const [transferToBoxId, setTransferToBoxId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState<Date | undefined>(new Date());
  const [isTransferring, setIsTransferring] = useState(false);

  // --- Handlers ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createName.trim()) {
      toast.error("Por favor, insira um nome para a caixinha");
      return;
    }

    setIsCreating(true);
    try {
      const goalAmount = createGoalAmount ? parseFloat(createGoalAmount) : undefined;
      const result = await createBox({
        name: createName.trim(),
        goalAmount: goalAmount && goalAmount > 0 ? goalAmount : undefined,
      });

      if (result) {
        setIsCreateOpen(false);
        setCreateName("");
        setCreateGoalAmount("");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (box: BoxDTO) => {
    setEditingBox(box);
    setEditName(box.name);
    setEditGoalAmount(box.goalAmount != null ? box.goalAmount.toString() : "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBox) return;

    if (!editName.trim()) {
      toast.error("Por favor, insira um nome para a caixinha");
      return;
    }

    setIsSavingEdit(true);
    try {
      const goalAmount = editGoalAmount ? parseFloat(editGoalAmount) : null;
      const result = await apiService.editBox({
        boxId: editingBox.id,
        name: editName.trim(),
        goalAmount: goalAmount && goalAmount > 0 ? goalAmount : null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Caixinha atualizada com sucesso");
        mutate("boxes");
        mutate("summary");
        setIsEditOpen(false);
        setEditingBox(null);
      }
    } catch (err) {
      console.error("Error editing box:", err);
      toast.error("Erro ao atualizar caixinha");
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
        toast.success("Caixinha removida com sucesso");
        mutate("boxes");
        mutate("summary");
        setIsDeleteOpen(false);
        setDeletingBox(null);
      }
    } catch (err) {
      console.error("Error deleting box:", err);
      toast.error("Erro ao remover caixinha");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transferFromBoxId || !transferToBoxId) {
      toast.error("Selecione as caixinhas de origem e destino");
      return;
    }

    if (transferFromBoxId === transferToBoxId) {
      toast.error("As caixinhas de origem e destino devem ser diferentes");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
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
        amount,
        date: getISODateString(transferDate),
      });

      if (result) {
        setIsTransferOpen(false);
        setTransferFromBoxId("");
        setTransferToBoxId("");
        setTransferAmount("");
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
    if (box.isDefault) return "Caixinha padrão não pode ser removida";
    if (box.balance !== 0) return "Caixinha com saldo não pode ser removida";
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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700 text-base">Caixinhas</h2>
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
            Nova Caixinha
          </Button>
        </div>
      </div>

      {/* Box List */}
      <ScrollArea className="flex flex-col flex-1 pr-3 overflow-y-auto">
        {boxes && boxes.length > 0 ? (
          <div className="space-y-3">
            {boxes.map((box) => (
              <div
                key={box.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {box.name}
                    </span>
                    {box.isDefault && (
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        padrao
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Editar caixinha"
                      onClick={() => handleOpenEdit(box)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title={getDeleteDisabledReason(box) || "Remover caixinha"}
                      disabled={!canDeleteBox(box)}
                      onClick={() => handleOpenDelete(box)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(box.balance)}
                </div>

                {box.goalAmount != null && box.goalProgress != null && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Meta: {formatCurrency(box.goalAmount)}</span>
                      <span>{Math.min(100, Math.round(box.goalProgress))}%</span>
                    </div>
                    <Progress
                      value={Math.min(100, box.goalProgress)}
                      filledColor={box.goalProgress >= 100 ? "#22c55e" : "#6366f1"}
                      bgColor="#e5e7eb"
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500">
            <p className="text-sm">Nenhuma caixinha encontrada</p>
            <p className="text-xs text-gray-400 mt-1">
              Crie uma nova caixinha para organizar suas finanças
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Create Box Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Caixinha</DialogTitle>
            <DialogDescription>
              Crie uma nova caixinha para organizar seus recursos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome</Label>
                <Input
                  id="create-name"
                  placeholder="Ex: Reserva de emergência"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-goal">Meta (opcional)</Label>
                <Input
                  id="create-goal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={createGoalAmount}
                  onChange={(e) => setCreateGoalAmount(e.target.value)}
                />
              </div>
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

      {/* Edit Box Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Caixinha</DialogTitle>
            <DialogDescription>
              Altere o nome ou a meta da caixinha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  placeholder="Nome da caixinha"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-goal">Meta (opcional)</Label>
                <Input
                  id="edit-goal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={editGoalAmount}
                  onChange={(e) => setEditGoalAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSavingEdit}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingEdit}>
                {isSavingEdit ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover caixinha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a caixinha &quot;{deletingBox?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir entre caixinhas</DialogTitle>
            <DialogDescription>
              Transfira recursos de uma caixinha para outra.
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
                    <SelectValue placeholder="Selecione a caixinha de origem" />
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
                    <SelectValue placeholder="Selecione a caixinha de destino" />
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
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
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
