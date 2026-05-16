import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { createWorkshop } from "@/lib/workshop.functions";
import { setCurrentWorkshopId } from "@/lib/workshop";
import { WorkshopSchema } from "@/lib/schemas";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Configurar oficina — MecânicoPRO" }] }),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, session, profile, loading, refreshProfile } = useAuth();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && profile?.workshop_id) {
      navigate({ to: "/" });
    }
  }, [loading, profile?.workshop_id, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = WorkshopSchema.safeParse({
      nome: nome.trim(),
      telefone: telefone.trim(),
      endereco: endereco.trim(),
    });
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const profileNome =
        (user?.user_metadata?.nome as string | undefined) ?? profile?.nome ?? null;
      const { workshopId } = await createWorkshop({
        data: {
          nome: validation.data.nome,
          telefone: validation.data.telefone || null,
          endereco: validation.data.endereco || null,
          profileNome,
        },
      });
      setCurrentWorkshopId(workshopId);
      await refreshProfile();
      toast.success("Oficina criada! Bem-vindo ao MecânicoPRO.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" search={{ redirect: "/onboarding" }} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary rounded-md p-1.5">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="font-display font-bold text-lg">MecânicoPRO</div>
        </div>
        <h1 className="text-xl font-bold mb-1">Configure sua oficina</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Último passo para começar a usar o sistema.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nome da oficina</Label>
            <Input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Oficina do João"
            />
          </div>
          <div>
            <Label>Telefone / WhatsApp</Label>
            <Input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-0000"
            />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, cidade"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Criando..." : "Criar oficina"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
