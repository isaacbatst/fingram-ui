import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

export function CreateVaultDialog() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshAuth } = useApi();

  const handleCreateVault = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3002"}/vault/create`, {
        method: "POST",
        credentials: "include", // Include cookies for HTTP-only authentication
      });

      if (!response.ok) {
        throw new Error("Erro ao criar o Duna");
      }

      await refreshAuth();
    } catch {
      setError("Erro ao criar o Duna. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Duna
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Criar Novo Duna</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja criar um novo Duna? Você será automaticamente conectado ao novo Duna.
            <br />
            <br />
            <strong>Nota:</strong> Se você já tem um Duna existente, você perderá o acesso a ele através desta sessão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="text-sm text-destructive bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] rounded-md p-3">
            {error}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCreateVault}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Duna"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
