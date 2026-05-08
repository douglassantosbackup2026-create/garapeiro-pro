import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit, MessageCircle, RefreshCw, CheckCircle2, DollarSign, Trash2, FileText, Star, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useServiceOrder, useUpdateOSStatus, type OSStatus } from "@/hooks/useServiceOrders";
import { useWorkshop } from "@/hooks/useWorkshop";
import {
  usePaymentsByOS,
  useAddPayment,
  useDeletePayment,
  paymentStatus,
  type FormaPagamento,
} from "@/hooks/usePayments";
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
import { cn } from "@/lib/utils";
import { baixarOrcamentoPDF } from "@/lib/pdf";

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
  const { data: payments } = usePaymentsByOS(osId);
  const addPayment = useAddPayment();
  const deletePayment = useDeletePayment();
  const update = useUpdateOSStatus();
  const [statusOpen, setStatusOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payValor, setPayValor] = useState("");
  const [payForma, setPayForma] = useState<FormaPagamento | "">("");
  const [payObs, setPayObs] = useState("");

  if (isLoading || !os) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  const total = Number(os.total_geral || 0);
  const paid = (payments ?? []).reduce((s, p) => s + Number(p.valor || 0), 0);
  const saldo = Math.max(0, total - paid);
  const pgtoStatus = paymentStatus(total, paid);
  const totalCusto = (os.service_order_parts ?? []).reduce(
    (s, p) => s + Number(p.custo_unitario || 0) * Number(p.quantidade || 0),
    0
  );
  const margem = total - totalCusto;
  const margemPct = total > 0 ? (margem / total) * 100 : 0;
  const vencimento = os.vencimento_fiado;
  const atrasado =
    saldo > 0 && vencimento && new Date(vencimento) < new Date(new Date().toDateString());

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

  const baixarPDF = () => {
    if (!workshop) return;
    baixarOrcamentoPDF(
      {
        numero: os.numero,
        criada_em: os.criada_em,
        previsao_entrega: os.previsao_entrega,
        observacoes: os.observacoes,
        forma_pagamento: os.forma_pagamento,
        km_entrada: os.km_entrada,
        cliente: {
          nome: os.clients?.nome ?? "",
          telefone: os.clients?.telefone ?? null,
          email: os.clients?.email ?? null,
        },
        veiculo: {
          placa: os.vehicles?.placa ?? "",
          marca: os.vehicles?.marca ?? null,
          modelo: os.vehicles?.modelo ?? null,
          ano: os.vehicles?.ano ?? null,
          cor: os.vehicles?.cor ?? null,
        },
        servicos: (os.service_order_services ?? []).map((s) => ({
          descricao: s.descricao,
          valor: Number(s.valor),
        })),
        pecas: (os.service_order_parts ?? []).map((p) => ({
          nome: p.nome,
          quantidade: p.quantidade,
          valor_unitario: Number(p.valor_unitario),
          valor_total: Number(p.valor_total),
        })),
        total_servicos: Number(os.total_servicos),
        total_pecas: Number(os.total_pecas),
        total_geral: Number(os.total_geral),
      },
      workshop
    );
    toast.success("PDF gerado");
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

  const openPay = () => {
    setPayValor(saldo > 0 ? saldo.toFixed(2) : "");
    setPayForma((os.forma_pagamento as FormaPagamento | null) ?? "");
    setPayObs("");
    setPayOpen(true);
  };

  const submitPay = () => {
    const valor = Number(payValor.replace(",", "."));
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    addPayment.mutate(
      {
        service_order_id: os.id,
        valor,
        forma_pagamento: (payForma || null) as FormaPagamento | null,
        observacao: payObs.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Pagamento registrado");
          setPayOpen(false);
        },
        onError: () => toast.error("Erro ao registrar pagamento"),
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
        <Link
          to="/os/$osId/editar"
          params={{ osId: os.id }}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted"
          aria-label="Editar OS"
        >
          <Edit className="h-4 w-4" />
        </Link>
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
        {totalCusto > 0 && (
          <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Margem (total − custo das peças)
            </span>
            <span className="font-semibold text-money">
              {formatBRL(margem)} ({margemPct.toFixed(0)}%)
            </span>
          </div>
        )}
      </Card>

      <Card className="p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-money" /> Pagamentos
          </h3>
          <PgtoTag status={pgtoStatus} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <div className="text-[11px] text-muted-foreground">Total</div>
            <div className="font-bold">{formatBRL(total)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Pago</div>
            <div className="font-bold text-money">{formatBRL(paid)}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Saldo</div>
            <div className={cn("font-bold", saldo > 0 ? "text-destructive" : "text-money")}>
              {formatBRL(saldo)}
            </div>
          </div>
        </div>

        {(payments ?? []).length > 0 && (
          <div className="space-y-1.5 mb-3">
            {(payments ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm border rounded-md px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <div className="font-medium">{formatBRL(p.valor)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(p.recebido_em)}
                    {p.forma_pagamento ? ` · ${p.forma_pagamento.replace("_", " ")}` : ""}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => {
                    if (confirm("Excluir este pagamento?")) {
                      deletePayment.mutate({ id: p.id, service_order_id: os.id });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full gap-1"
          onClick={openPay}
          disabled={saldo <= 0}
        >
          <DollarSign className="h-4 w-4" />
          {saldo <= 0 ? "OS quitada" : "Registrar pagamento"}
        </Button>
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
        {vencimento && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vencimento (fiado):</span>
            <span className={cn(atrasado && "text-destructive font-semibold")}>
              {formatDate(vencimento)} {atrasado ? "· atrasado" : ""}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pagamento:</span>
          <span className="capitalize">
            {os.forma_pagamento?.replace("_", " ") ?? "—"}
          </span>
        </div>
        {os.nota_satisfacao != null && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Satisfação:</span>
            <span className="inline-flex items-center gap-0.5 font-semibold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < (os.nota_satisfacao ?? 0)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/40"
                  )}
                />
              ))}
              <span className="ml-1">{os.nota_satisfacao}/5</span>
            </span>
          </div>
        )}
        {os.observacoes && (
          <div className="pt-2 border-t mt-2">
            <div className="text-xs text-muted-foreground mb-1">Observações</div>
            <p>{os.observacoes}</p>
          </div>
        )}
      </Card>

      {/* Action bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-60 bg-background border-t p-3 grid grid-cols-4 gap-2 z-20">
        <Button variant="outline" onClick={enviarOrcamento} className="gap-1">
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>
        <Button variant="outline" onClick={baixarPDF} className="gap-1">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">PDF</span>
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

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <div>
              <Label htmlFor="pay-valor">Valor (R$)</Label>
              <Input
                id="pay-valor"
                inputMode="decimal"
                value={payValor}
                onChange={(e) => setPayValor(e.target.value)}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Saldo em aberto: {formatBRL(saldo)}
              </p>
            </div>
            <div>
              <Label htmlFor="pay-forma">Forma de pagamento</Label>
              <Select
                value={payForma || undefined}
                onValueChange={(v) => setPayForma(v as FormaPagamento)}
              >
                <SelectTrigger id="pay-forma">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pay-obs">Observação (opcional)</Label>
              <Input
                id="pay-obs"
                value={payObs}
                onChange={(e) => setPayObs(e.target.value)}
                placeholder="Ex: 1ª parcela"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitPay} disabled={addPayment.isPending}>
              {addPayment.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PgtoTag({ status }: { status: "pago" | "parcial" | "aberto" }) {
  const map = {
    pago: "bg-status-delivered text-status-delivered-foreground",
    parcial: "bg-status-progress text-status-progress-foreground",
    aberto: "bg-status-cancel text-status-cancel-foreground",
  };
  const label = { pago: "Pago", parcial: "Parcial", aberto: "Em aberto" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        map[status]
      )}
    >
      {label[status]}
    </span>
  );
}