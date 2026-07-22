import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import type { ReactNode } from "react";

/**
 * Envelope simples para rotas/áreas restritas ao dono da oficina.
 * Enquanto carrega, mostra skeleton para evitar flash. Mecânicos veem tela
 * de bloqueio com CTA para voltar.
 */
export function DonoOnlyGate({ children, area = "esta área" }: { children: ReactNode; area?: string }) {
  const { isDono, isLoading } = useRole();
  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>;
  }
  if (!isDono) {
    return (
      <div className="px-4 md:px-8 py-16 max-w-lg mx-auto text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Apenas o dono da oficina pode acessar {area}. Peça para o responsável promover
          sua conta se você precisar deste acesso.
        </p>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}