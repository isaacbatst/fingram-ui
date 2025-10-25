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
import { toast } from "sonner";

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
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status}`);
      }

      toast.success("Carteira criada com sucesso! Você será automaticamente logada na nova carteira.");
      
      await refreshAuth();
    } catch (error) {
      console.error("Error creating vault:", error);
      setError(error instanceof Error ? error.message : "Erro ao criar cofre");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Criar Nova Carteira
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Criar Nova Carteira</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja criar uma nova carteira? Você será automaticamente logada na nova carteira.
            <br />
            <br />
            <strong>Nota:</strong> Se você já tem uma carteira existente, você perderá o acesso a ela através desta sessão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
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
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Carteira"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
