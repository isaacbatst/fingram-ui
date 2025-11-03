import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, X } from "lucide-react";
import { useApi } from "@/hooks/useApi";

export function TempTokenConfirmation() {
  const auth = useApi();

  if (!auth.pendingTempToken) {
    return null;
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Confirmar Acesso ao Cofre</CardTitle>
          <CardDescription>
            Você recebeu um link de acesso ao seu cofre. 
            Clique em "Confirmar" para acessar ou "Cancelar" para descartar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>⚠️ <strong>Importante:</strong> Este link é de uso único e expira em 1 hora.</p>
            <p className="mt-2">
              Ao confirmar, você será autenticado no cofre e poderá gerenciar suas finanças.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={auth.confirmTempTokenExchange}
              disabled={auth.isLoading}
              className="flex-1"
            >
              {auth.isLoading ? "Autenticando..." : "Confirmar Acesso"}
            </Button>
            <Button 
              variant="outline" 
              onClick={auth.dismissTempToken}
              disabled={auth.isLoading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
          
          {auth.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {auth.error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
