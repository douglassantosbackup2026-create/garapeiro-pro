import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit, MessageCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServiceOrder, useUpdateOSStatus, type OSStatus } from "@/hooks/useServiceOrders";
import { useWorkshop } from "@/hooks/useWorkshop";
import { PlacaBadge } from "@/components/PlacaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  formatBRL,
  formatDate,
  formatDateTime,
  formatOSNumber,
  formatPhone,
} from "@/lib/format";
import {
  buildWhatsappUrl,
  renderAtualizacao,
  renderOrcamento,
  STATUS_LABEL,
} from "@/lib/whatsapp";
import { toast } from "sonner";

export const Route = createFileRoute("/os/$osId")({ component: OSDetail });

const STATUSES: OSStatus[] = [
  "aguardando_aprovacao",
  "em_andamento",
  "aguardando_peca",
  "concluido",
  "entregue",
  "cancelado",
];

function OSDetail() {
  const { osId } = Route.useParams();
  const navigate = useNavigate();
  const { data: os, isLoading } = useServiceOrder(osId);
  const { data: workshop } = useWorkshop();
  const update = useUpdateOSStatus();
  const [statusOpen, setStatusOpen] = useState(false);

  if (isLoading || !os) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  const veiculo = `${os.vehicles?.marca ?? ""} ${os.vehicles?.modelo ?? ""}`.trim();

  const buildMessage = () =>
    workshop
      ? renderOrcamento(
          {
            numero: os.numero,
            cliente_nome: os.clients?.nome ?? "",
            veiculo,
            placa: os.vehicles?.placa ?? "",
            servicos: os.service_order_services ?? [],
            pecas: (os.service_order_parts ?? []).map((p) => ({
              nome: p.nome,
              quantidade: p.quantidade,
              valor_total: Number(p.valor_total),
            })),
            total: Number(os.total_geral),
            previsao_entrega: os.previsao_entrega,
          },
          workshop
        )
      : "";

  const enviarOrcamento = () => {
    if (!os.clients?.telefone) return;
    window.open(buildWhatsappUrl(os.clients.telefone, buildMessage()), "_blank");
  };

  const mudarStatus = (s: OSStatus) => {
    update.mutate(
      { id: os.id, status: s },
      {
        onSuccess: () => {
          toast.success(`Status atualizado: ${STATUS_LABEL[s]}`);
          setStatusOpen(false);
          if (workshop && os.clients?.telefone) {
            const url = buildWhatsappUrl(
              os.clients.telefone,
              renderAtualizacao(
                {
                  numero: os.numero,
                  cliente_nome: os.clients.nome,
                  veiculo,
                  placa: os.vehicles?.placa ?? "",
                  servicos: [],
                  pecas: [],
                  total: 0,
                  status: STATUS_LABEL[s],
                },
                workshop
              )
            );
            window.open(url, "_blank");
          }
        },
      }
    );
  };

  return (
    <div className="px-4 md:px-8 py-5 pb-32 max-w-2xl mx-auto">
      <button
        onClick={() => navigate({ to: "/os" })}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <header className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{formatOSNumber(os.numero)}</h1>
            <StatusBadge status={os.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Criada em {formatDateTime(os.criada_em)}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </header>

      <Card className="p-4 mb-3">
        <div className="flex items-center gap-3 mb-2">
          <PlacaBadge placa={os.vehicles?.placa ?? ""} size="lg" />
          <div>
            <div className="font-bold">{veiculo}</div>
            <div className="text-xs text-muted-foreground">
              {os.vehicles?.ano} · {os.vehicles?.cor} · {os.km_entrada ?? os.vehicles?.km} km
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Cliente</div>
            <div className="font-bold">{os.clients?.nome}</div>
            <div className="text-sm text-muted-foreground">
              {formatPhone(os.clients?.telefone)}
            </div>
          </div>
          <WhatsAppButton phone={os.clients?.telefone ?? ""} />
        </div>
      </Card>

      <Card className="p-4 mb-3">
        <h3 className="font-bold mb-2">Serviços e Peças</h3>
        {(os.service_order_services ?? []).map((s) => (
          <div key={s.id} className="flex justify-between text-sm py-1">
            <span>{s.descricao}</span>
            <span className="font-medium">{formatBRL(s.valor)}</span>
          </div>
        ))}
        {(os.service_order_parts ?? []).map((p) => (
          <div key={p.id} className="flex justify-between text-sm py-1">
            <span>
              {p.nome} <span className="text-muted-foreground">x{p.quantidade}</span>
            </span>
            <span className="font-medium">{formatBRL(p.valor_total)}</span>
          </div>
        ))}
        <div className="flex justify-between mt-3 pt-3 border-t">
          <span className="font-bold">Total</span>
          <span className="font-display font-bold text-xl text-money">
            {formatBRL(os.total_geral)}
          </span>
        </div>
      </Card>

      <Card className="p-4 mb-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entrada:</span>
          <span>{formatDate(os.data_entrada)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Previsão:</span>
          <span>{os.previsao_entrega ? formatDate(os.previsao_entrega) : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pagamento:</span>
          <span className="capitalize">
            {os.forma_pagamento?.replace("_", " ") ?? "—"}
          </span>
        </div>
        {os.observacoes && (
          <div className="pt-2 border-t mt-2">
            <div className="text-xs text-muted-foreground mb-1">Observações</div>
            <p>{os.observacoes}</p>
          </div>
        )}
      </Card>

      {/* Action bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-60 bg-background border-t p-3 grid grid-cols-3 gap-2 z-20">
        <Button variant="outline" onClick={enviarOrcamento} className="gap-1">
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Orçamento</span>
        </Button>
        <Button variant="outline" onClick={() => setStatusOpen(true)} className="gap-1">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Status</span>
        </Button>
        <Button onClick={() => mudarStatus("entregue")} className="gap-1">
          <CheckCircle2 className="h-4 w-4" />
          <span className="hidden sm:inline">Entregue</span>
        </Button>
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 mt-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={s === os.status ? "default" : "outline"}
                onClick={() => mudarStatus(s)}
              >
                {STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}