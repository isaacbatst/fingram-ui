import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { Loader2, Key } from "lucide-react";
import { CreateVaultDialog } from "./CreateVaultDialog";

export function VaultAccessTokenInput() {
  const [accessToken, setAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticateWithVaultToken } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim()) {
      setError("Por favor, insira um token de acesso válido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authenticateWithVaultToken(accessToken.trim());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao autenticar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto duna-surface border-[var(--color-border)]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <span className="font-display text-2xl font-semibold italic text-[var(--color-accent)] tracking-tight">duna</span>
        </div>
        <CardTitle className="font-display tracking-tight">Acesso ao Cofre</CardTitle>
        <CardDescription>
          Digite seu token de acesso para acessar seu cofre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessToken">Token de Acesso</Label>
            <Input
              id="accessToken"
              type="text"
              placeholder="Digite seu token de acesso"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isLoading}
              className="font-mono text-sm"
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] rounded-md p-3">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !accessToken.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Autenticando...
              </>
            ) : (
              "Acessar Cofre"
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>Você pode obter seu token de acesso através do bot do Telegram</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-center text-sm text-muted-foreground mb-3">
            Ou crie um novo cofre
          </div>
          <CreateVaultDialog />
        </div>
      </CardContent>
    </Card>
  );
}
