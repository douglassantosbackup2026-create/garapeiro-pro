import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Rocket, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Card de boas-vindas no dashboard. Aparece uma vez, até o dono clicar em "Já vi".
 * Dispensa persiste em `profiles.tour_completed_at`.
 */
export function OnboardingTour() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dismissing, setDismissing] = useState(false);

  const q = useQuery({
    queryKey: ["profile_tour", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("tour_completed_at")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.tour_completed_at ?? null;
    },
  });

  if (q.isLoading || q.data) return null;

  const dismiss = async () => {
    setDismissing(true);
    await supabase
      .from("profiles")
      .update({ tour_completed_at: new Date().toISOString() })
      .eq("id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile_tour"] });
  };

  const steps = [
    { to: "/clientes", label: "1. Cadastre um cliente" },
    { to: "/os/nova", label: "2. Abra uma OS" },
    { to: "/os/kanban", label: "3. Mova pelo painel Kanban" },
    { to: "/alertas", label: "4. Veja alertas inteligentes" },
  ];

  return (
    <Card className="p-4 bg-primary/5 border-primary/20 relative">
      <button
        type="button"
        onClick={dismiss}
        disabled={dismissing}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-primary/10 text-muted-foreground"
        aria-label="Dispensar guia"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-md">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">Bem-vindo ao OficinaPRO</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Comece com estes 4 passos. Prefere testar antes com dados de exemplo?
            Vá em <Link to="/configuracoes" className="underline">Configurações → Ambiente</Link>.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {steps.map((s) => (
              <Button key={s.to} asChild size="sm" variant="outline">
                <Link to={s.to as string}>{s.label}</Link>
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={dismiss}
              disabled={dismissing}
            >
              Já vi
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}