import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { acceptInvite } from "@/lib/workshop.functions";

export const Route = createFileRoute("/convite/$token")({
  component: ConvitePage,
  head: () => ({ meta: [{ title: "Convite — MecânicoPRO" }] }),
});

function ConvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { session, loading, refreshProfile } = useAuth();
  const [accepting, setAccepting] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    try {
      await acceptInvite({ data: { token } });
      await refreshProfile();
      toast.success("Você entrou na oficina!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-primary rounded-md p-1.5">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="font-display font-bold text-lg">MecânicoPRO</div>
        </div>
        <h1 className="text-xl font-bold mb-2">Convite para oficina</h1>
        {session ? (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Você foi convidado para participar de uma oficina. Clique abaixo para aceitar.
            </p>
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting ? "Entrando..." : "Entrar na oficina"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Faça login ou crie uma conta com o mesmo e-mail do convite para aceitar.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to="/login" search={{ redirect: `/convite/${token}` }}>
                  Entrar
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/cadastro" search={{ redirect: `/convite/${token}` }}>
                  Criar conta
                </Link>
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
