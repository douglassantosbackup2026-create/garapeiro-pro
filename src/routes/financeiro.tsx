import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, MessageCircle, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import { useAllPayments, useAddPayment, paymentStatus, type FormaPagamento } from "@/hooks/usePayments";
import { useWorkshop } from "@/hooks/useWorkshop";
import { PlacaBadge } from "@/components/PlacaBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { formatBRL, formatOSNumber, formatDate } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

import { DonoOnlyGate } from "@/components/DonoOnlyGate";

export const Route = createFileRoute("/financeiro")({
  component: () => (
    <DonoOnlyGate area="o Financeiro">
      <FinanceiroPage />
    </DonoOnlyGate>
  ),
});

const FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "aberto", label: "Em aberto" },
  { value: "parcial", label: "Parcial" },
  { value: "pago", label: "Pago" },
] as const;

function useFinanceiroOrders() {
  return useQuery({
    queryKey: ["financeiro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select(
          "id, numero, status, total_geral, data_entrada, vencimento_fiado, clients(nome, telefone), vehicles(placa)",
        )
        .eq("workshop_id", getCurrentWorkshopId())
        .neq("status", "cancelado")
        .order("data_entrada", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

type FinanceRow = {
  id: string;
  numero: number;
  total: number;
  paid: number;
  saldo: number;
  clients?: { nome: string; telefone: string } | null;
  vehicles?: { placa: string } | null;
};

function FinanceiroPage() {
  const { data: orders } = useFinanceiroOrders();
  const { data: paidMap } = useAllPayments();
  const { data: workshop } = useWorkshop();
  const addPayment = useAddPayment();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("aberto");
  const [payRow, setPayRow] = useState<FinanceRow | null>(null);
  const [payValor, setPayValor] = useState("");
  const [payForma, setPayForma] = useState<FormaPagamento | "">("");

  const rows = useMemo(() => {
    return (orders ?? []).map((o) => {
      const total = Number(o.total_geral || 0);
      const paid = paidMap?.get(o.id) ?? 0;
      const saldo = Math.max(0, total - paid);
      return { ...o, total, paid, saldo, status_pgto: paymentStatus(total, paid) };
    });
  }, [orders, paidMap]);

  const filtered = rows.filter((r) => filter === "todas" || r.status_pgto === filter);

  const totalAberto = rows.reduce((s, r) => s + r.saldo, 0);
  const totalRecebido = rows.reduce((s, r) => s + r.paid, 0);

  const cobrar = (r: (typeof rows)[number]) => {
    if (!r.clients?.telefone) return;
    const msg = `Olá ${r.clients?.nome ?? ""}! 👋\n\nPassando para lembrar da OS ${formatOSNumber(
      r.numero,
    )} (placa ${r.vehicles?.placa ?? ""}) que está com saldo em aberto de *${formatBRL(
      r.saldo,
    )}*.\n\nQualquer dúvida, é só chamar! 🙏\n\n— ${workshop?.nome ?? ""}`;
    window.open(buildWhatsappUrl(r.clients.telefone, msg), "_blank", "noopener,noreferrer");
  };

  const openPay = (r: (typeof rows)[number]) => {
    setPayRow(r);
    setPayValor(r.saldo > 0 ? r.saldo.toFixed(2) : "");
    setPayForma("pix");
  };

  const submitPay = () => {
    if (!payRow) return;
    const valor = Number(payValor.replace(",", "."));
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    addPayment.mutate(
      {
        service_order_id: payRow.id,
        valor,
        forma_pagamento: (payForma || null) as FormaPagamento | null,
      },
      {
        onSuccess: () => {
          toast.success("Pagamento registrado");
          setPayRow(null);
        },
        onError: () => toast.error("Erro ao registrar pagamento"),
      },
    );
  };

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-money" /> Financeiro
        </h1>
        <p className="text-sm text-muted-foreground">Controle de recebimentos e fiado por OS.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">A receber (saldo)</div>
          <div className="text-2xl font-display font-bold text-destructive">
            {formatBRL(totalAberto)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Já recebido</div>
          <div className="text-2xl font-display font-bold text-money">
            {formatBRL(totalRecebido)}
          </div>
        </Card>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
              filter === f.value
                ? "bg-secondary text-secondary-foreground border-secondary"
                : "bg-background text-foreground border-border",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma OS neste filtro.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="p-3">
              <div className="flex items-center gap-3">
                <Link to="/os/$osId" params={{ osId: r.id }} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-bold text-muted-foreground">
                      {formatOSNumber(r.numero)}
                    </span>
                    <PlacaBadge placa={r.vehicles?.placa ?? ""} size="sm" />
                    <PaymentStatusBadge status={r.status_pgto} />
                  </div>
                  <div className="text-sm font-medium truncate">{r.clients?.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    Entrada: {formatDate(r.data_entrada)} · Total {formatBRL(r.total)} · Pago{" "}
                    {formatBRL(r.paid)}
                  </div>
                  {r.vencimento_fiado && r.saldo > 0 && (
                    <div
                      className={cn(
                        "text-xs mt-0.5 font-medium",
                        new Date(r.vencimento_fiado) < new Date(new Date().toDateString())
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      Vence em {formatDate(r.vencimento_fiado)}
                      {new Date(r.vencimento_fiado) < new Date(new Date().toDateString())
                        ? " · atrasado"
                        : ""}
                    </div>
                  )}
                </Link>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <div>
                    <div className="text-xs text-muted-foreground">Saldo</div>
                    <div
                      className={cn(
                        "font-display font-bold text-lg",
                        r.saldo > 0 ? "text-destructive" : "text-money",
                      )}
                    >
                      {formatBRL(r.saldo)}
                    </div>
                  </div>
                  {r.saldo > 0 && (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openPay(r)}
                        className="h-7 px-2 gap-1"
                      >
                        <Banknote className="h-3.5 w-3.5" /> Receber
                      </Button>
                      {r.clients?.telefone && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => cobrar(r)}
                          className="text-[#25D366] hover:text-[#1ea952] gap-1 h-7 px-2"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Cobrar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!payRow} onOpenChange={(o) => !o && setPayRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrar pagamento
              {payRow ? ` · ${formatOSNumber(payRow.numero)}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <div>
              <Label>Valor (R$)</Label>
              <Input
                inputMode="decimal"
                value={payValor}
                onChange={(e) => setPayValor(e.target.value)}
                placeholder="0,00"
              />
              {payRow && (
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo em aberto: {formatBRL(payRow.saldo)}
                </p>
              )}
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select
                value={payForma || undefined}
                onValueChange={(v) => setPayForma(v as FormaPagamento)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="parcelado">Parcelado</SelectItem>
                  <SelectItem value="a_combinar">A combinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPayRow(null)}>
              Cancelar
            </Button>
            <Button onClick={submitPay} disabled={addPayment.isPending}>
              {addPayment.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
