import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_WORKSHOP_ID } from "@/lib/workshop";
import { useAllPayments, paymentStatus } from "@/hooks/usePayments";
import { useWorkshop } from "@/hooks/useWorkshop";
import { PlacaBadge } from "@/components/PlacaBadge";
import { formatBRL, formatOSNumber, formatDate } from "@/lib/format";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro")({ component: FinanceiroPage });

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
          "id, numero, status, total_geral, data_entrada, clients(nome, telefone), vehicles(placa)"
        )
        .eq("workshop_id", DEFAULT_WORKSHOP_ID)
        .neq("status", "cancelado")
        .order("data_entrada", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function FinanceiroPage() {
  const { data: orders } = useFinanceiroOrders();
  const { data: paidMap } = useAllPayments();
  const { data: workshop } = useWorkshop();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("aberto");

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
      r.numero
    )} (placa ${r.vehicles?.placa ?? ""}) que está com saldo em aberto de *${formatBRL(
      r.saldo
    )}*.\n\nQualquer dúvida, é só chamar! 🙏\n\n— ${workshop?.nome ?? ""}`;
    window.open(buildWhatsappUrl(r.clients.telefone, msg), "_blank");
  };

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-money" /> Financeiro
        </h1>
        <p className="text-sm text-muted-foreground">
          Controle de recebimentos e fiado por OS.
        </p>
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
                : "bg-background text-foreground border-border"
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
                <Link
                  to="/os/$osId"
                  params={{ osId: r.id }}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-bold text-muted-foreground">
                      {formatOSNumber(r.numero)}
                    </span>
                    <PlacaBadge placa={r.vehicles?.placa ?? ""} size="sm" />
                    <PgtoBadge status={r.status_pgto} />
                  </div>
                  <div className="text-sm font-medium truncate">{r.clients?.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    Entrada: {formatDate(r.data_entrada)} · Total {formatBRL(r.total)} · Pago{" "}
                    {formatBRL(r.paid)}
                  </div>
                </Link>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">Saldo</div>
                  <div
                    className={cn(
                      "font-display font-bold text-lg",
                      r.saldo > 0 ? "text-destructive" : "text-money"
                    )}
                  >
                    {formatBRL(r.saldo)}
                  </div>
                  {r.saldo > 0 && r.clients?.telefone && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => cobrar(r)}
                      className="mt-1 text-[#25D366] hover:text-[#1ea952] gap-1 h-7 px-2"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Cobrar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PgtoBadge({ status }: { status: "pago" | "parcial" | "aberto" }) {
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