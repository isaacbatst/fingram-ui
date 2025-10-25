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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApi } from "@/hooks/useApi";
import { LogOut, Share2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AccountButton() {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { logout } = useApi();

  const requestShareLink = async () => {
    const response = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3002"
      }/vault/share-link`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const body = (await response.json()) as { token: string };
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?token=${body.token}`;
    await navigator.clipboard.writeText(shareUrl);
  };

  const handleShare = async () => {
    toast.promise(requestShareLink(), {
      loading: "Gerando link de compartilhamento...",
      success: "Link copiado para a área de transferência!",
      error: "Erro ao gerar link de compartilhamento",
    });
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            title="Conta"
          >
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar carteira
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar logout</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Você precisará inserir seu token de
              acesso novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
