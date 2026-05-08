import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVehicle } from "@/hooks/useVehicles";
import { PlacaBadge } from "@/components/PlacaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { formatBRL, formatDate, formatOSNumber, formatPhone } from "@/lib/format";

export const Route = createFileRoute("/veiculos/$vehicleId")({ component: VehicleDetail });

function VehicleDetail() {
  const { vehicleId } = Route.useParams();
  const navigate = useNavigate();
  const { data: v, isLoading } = useVehicle(vehicleId);
  if (isLoading || !v) return <div className="p-8 text-center">Carregando...</div>;

  const orders = (v.service_orders ?? []).slice().sort(
    (a, b) => new Date(b.data_entrada).getTime() - new Date(a.data_entrada).getTime()
  );

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto">
      <button
        onClick={() => navigate({ to: "/veiculos" })}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="flex items-center justify-center mb-4">
        <PlacaBadge placa={v.placa} size="xl" />
      </div>

      <Card className="p-4 mb-3">
        <h3 className="font-bold mb-2">Veículo</h3>
        <div className="text-sm space-y-1">
          <div>
            {v.marca} {v.modelo} · {v.ano}
          </div>
          <div className="text-muted-foreground">
            Cor: {v.cor ?? "—"} · {v.km ?? 0} km
          </div>
        </div>
      </Card>

      <Card className="p-4 mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Proprietário</div>
          <div className="font-bold">{v.clients?.nome}</div>
          <div className="text-sm text-muted-foreground">
            {formatPhone(v.clients?.telefone)}
          </div>
        </div>
        <WhatsAppButton phone={v.clients?.telefone ?? ""} />
      </Card>

      <h3 className="font-bold mb-2 mt-5">Histórico de Serviços</h3>
      {orders.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum serviço ainda neste veículo.
        </Card>
      ) : (
        <div className="relative pl-5 space-y-3">
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
          {orders.map((o) => (
            <Link
              key={o.id}
              to="/os/$osId"
              params={{ osId: o.id }}
              className="block relative"
            >
              <div className="absolute -left-[18px] top-3 h-3 w-3 rounded-full bg-primary border-2 border-background" />
              <Card className="p-3 hover:border-primary">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {formatOSNumber(o.numero)}
                  </span>
                  <StatusBadge status={o.status} />
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDate(o.data_entrada)}
                  </span>
                </div>
                <div className="text-sm">
                  {(o.service_order_services ?? []).map((s) => s.descricao).join(", ") || "—"}
                </div>
                <div className="text-money font-bold text-sm mt-1">
                  {formatBRL(o.total_geral)}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Button
        size="lg"
        className="w-full mt-5 gap-1"
        onClick={() => navigate({ to: "/os/nova" })}
      >
        <Plus className="h-4 w-4" /> Nova OS para este veículo
      </Button>
    </div>
  );
}