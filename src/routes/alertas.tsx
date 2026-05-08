import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReturnAlerts, useDismissAlert } from "@/hooks/useReturnAlerts";
import { useWorkshop } from "@/hooks/useWorkshop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PlacaBadge } from "@/components/PlacaBadge";
import { EmptyState } from "@/components/EmptyState";
import { renderRetorno } from "@/lib/whatsapp";

export const Route = createFileRoute("/alertas")({ component: Alertas });

function Alertas() {
  const navigate = useNavigate();
  const { data: alerts } = useReturnAlerts();
  const { data: workshop } = useWorkshop();
  const dismiss = useDismissAlert();

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto">
      <button
        onClick={() => navigate({ to: "/" })}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="text-2xl font-bold">Clientes para contatar</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Esses clientes não visitaram sua oficina há mais de 90 dias. Entre em contato para
        não perder o cliente.
      </p>
      {(alerts ?? []).length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nenhum alerta"
          description="Todos os clientes estão em dia. 🎉"
        />
      ) : (
        <div className="space-y-2">
          {alerts!.map((a) => (
            <Card key={a.clientId} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold">{a.nome}</div>
                  <div className="text-xs text-destructive font-semibold">
                    {a.diasSemVisita} dias sem visita
                  </div>
                </div>
                {a.ultimoVeiculo && <PlacaBadge placa={a.ultimoVeiculo.placa} size="sm" />}
              </div>
              {a.ultimoVeiculo && (
                <div className="text-xs text-muted-foreground mb-1">
                  {a.ultimoVeiculo.marca} {a.ultimoVeiculo.modelo}
                </div>
              )}
              {a.ultimoServico && (
                <div className="text-xs text-muted-foreground mb-2">
                  Último serviço: {a.ultimoServico}
                </div>
              )}
              <div className="flex gap-2">
                <WhatsAppButton
                  phone={a.telefone}
                  message={renderRetorno(
                    a.nome,
                    a.ultimoVeiculo
                      ? `${a.ultimoVeiculo.marca ?? ""} ${a.ultimoVeiculo.modelo ?? ""}`
                      : "seu carro",
                    a.ultimoVeiculo?.placa ?? "",
                    workshop ?? { nome: "nossa oficina" }
                  )}
                  variant="default"
                  size="sm"
                  label="Avisar pelo WhatsApp"
                  className="text-primary-foreground bg-primary hover:bg-primary/90"
                />
                <Button size="sm" variant="outline" onClick={() => dismiss.mutate(a.clientId)}>
                  Marcar como contatado
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}