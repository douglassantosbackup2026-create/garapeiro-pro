import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BellOff, Cake, Gauge, Calendar, Heart, Phone, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSmartAlerts, type SmartAlert } from "@/hooks/useSmartAlerts";
import { useDismissAlert } from "@/hooks/useReturnAlerts";
import { useUpdateSatisfaction } from "@/hooks/useServiceOrders";
import { useWorkshop } from "@/hooks/useWorkshop";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { EmptyState } from "@/components/EmptyState";
import { renderRetorno } from "@/lib/whatsapp";
import { formatOSNumber } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alertas")({ component: Alertas });

function buildMessage(a: SmartAlert, workshopNome: string): string {
  switch (a.tipo) {
    case "retorno":
      return `Olá ${a.nome}! 👋 Faz ${a.diasSemVisita} dias que não vemos você por aqui. ${
        a.veiculo ? `Seu ${a.veiculo} ${a.placa ? `(${a.placa}) ` : ""}` : "Seu carro "
      }pode estar precisando de revisão. Quer agendar? 🔧`;
    case "revisao_km":
      return `Olá ${a.nome}! 👋 Aqui é da ${workshopNome}. Seu ${a.veiculo} (${a.placa}) está com ${a.kmAtual.toLocaleString("pt-BR")} km e a próxima revisão está marcada para ${a.kmProxima.toLocaleString("pt-BR")} km. Quer agendar? 🔧`;
    case "revisao_tempo":
      return `Olá ${a.nome}! 👋 Já se passaram ${a.mesesDesde} meses desde a última revisão do seu ${a.veiculo} (${a.placa}). Que tal agendar uma nova? 🛠️`;
    case "aniversario":
      return `Olá ${a.nome}! 🎉🎂 A equipe da ${workshopNome} deseja um feliz aniversário! Como presente, oferecemos uma condição especial na próxima revisão. Fale com a gente!`;
    case "satisfacao":
      return `Olá ${a.nome}! 👋 Aqui é da ${workshopNome}. Como foi sua experiência com o serviço da OS ${formatOSNumber(a.osNumero)}? Sua opinião nos ajuda muito! ⭐`;
  }
}

const META: Record<SmartAlert["tipo"], { label: string; icon: typeof Cake; color: string }> = {
  retorno: { label: "Retorno", icon: Phone, color: "bg-destructive/10 text-destructive" },
  revisao_km: {
    label: "Revisão (km)",
    icon: Gauge,
    color: "bg-status-progress/30 text-status-progress-foreground",
  },
  revisao_tempo: {
    label: "Revisão (tempo)",
    icon: Calendar,
    color: "bg-status-progress/30 text-status-progress-foreground",
  },
  aniversario: { label: "Aniversário", icon: Cake, color: "bg-primary/10 text-primary" },
  satisfacao: { label: "Pós-entrega", icon: Heart, color: "bg-money/10 text-money" },
};

function descricao(a: SmartAlert): string {
  switch (a.tipo) {
    case "retorno":
      return `${a.diasSemVisita} dias sem visita${a.veiculo ? ` · ${a.veiculo}` : ""}`;
    case "revisao_km":
      return `${a.veiculo} (${a.placa}) — ${a.kmAtual.toLocaleString("pt-BR")} km de ${a.kmProxima.toLocaleString("pt-BR")} km`;
    case "revisao_tempo":
      return `${a.veiculo} (${a.placa}) — ${a.mesesDesde} meses desde a última revisão`;
    case "aniversario":
      return a.diasParaAniversario === 0
        ? "Aniversário hoje! 🎂"
        : `Aniversário em ${a.diasParaAniversario} dia(s)`;
    case "satisfacao":
      return `OS ${formatOSNumber(a.osNumero)} entregue há ${a.diasDesdeEntrega} dia(s)`;
  }
}

function Alertas() {
  const navigate = useNavigate();
  const { data: alerts } = useSmartAlerts();
  const { data: workshop } = useWorkshop();
  const dismiss = useDismissAlert();
  const updateSat = useUpdateSatisfaction();
  const [satOs, setSatOs] = useState<{ id: string; numero: number; nome: string } | null>(null);
  const [satNota, setSatNota] = useState<1 | 2 | 3 | 4 | 5>(5);

  const list = alerts ?? [];

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto pb-20">
      <button
        onClick={() => navigate({ to: "/" })}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="text-2xl font-bold">Lembretes inteligentes</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Retornos, revisões, aniversários e pesquisas pós-entrega.
      </p>

      {list.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Tudo em dia"
          description="Nenhum lembrete pendente no momento. 🎉"
        />
      ) : (
        <div className="space-y-2">
          {list.map((a) => {
            const meta = META[a.tipo];
            const Icon = meta.icon;
            const msg = buildMessage(a, workshop?.nome ?? "nossa oficina");
            const fallbackMsg =
              a.tipo === "retorno"
                ? renderRetorno(
                    a.nome,
                    a.veiculo ?? "seu carro",
                    a.placa ?? "",
                    workshop ?? { nome: "nossa oficina" },
                  )
                : msg;
            return (
              <Card key={a.key} className="p-3">
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate">{a.nome}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{descricao(a)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <WhatsAppButton
                    phone={a.telefone}
                    message={fallbackMsg}
                    variant="default"
                    size="sm"
                    label="WhatsApp"
                    className="text-primary-foreground bg-primary hover:bg-primary/90"
                  />
                  {a.tipo === "satisfacao" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSatOs({ id: a.osId, numero: a.osNumero, nome: a.nome });
                        setSatNota(5);
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" /> Registrar nota
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => dismiss.mutate(a.clientId)}>
                    Dispensar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!satOs} onOpenChange={(o) => !o && setSatOs(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nota de satisfação · {satOs ? formatOSNumber(satOs.numero) : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{satOs?.nome} respondeu com qual nota?</p>
          <div className="flex justify-center gap-2 my-4">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSatNota(n)}
                className="p-1"
                aria-label={`${n} estrelas`}
              >
                <Star
                  className={cn(
                    "h-9 w-9 transition-colors",
                    n <= satNota ? "fill-primary text-primary" : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSatOs(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!satOs) return;
                await updateSat.mutateAsync({ id: satOs.id, nota: satNota });
                toast.success("Nota registrada");
                setSatOs(null);
              }}
              disabled={updateSat.isPending}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
