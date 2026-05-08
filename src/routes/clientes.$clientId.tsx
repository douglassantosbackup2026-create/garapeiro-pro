import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useClient } from "@/hooks/useClients";
import { PlacaBadge } from "@/components/PlacaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { formatBRL, formatDate, formatOSNumber, formatPhone } from "@/lib/format";

export const Route = createFileRoute("/clientes/$clientId")({ component: ClientDetail });

function ClientDetail() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const { data: c, isLoading } = useClient(clientId);
  if (isLoading || !c) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto">
      <button
        onClick={() => navigate({ to: "/clientes" })}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="text-2xl font-bold mb-4">{c.nome}</h1>
      <Card className="p-4 mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Contato</div>
          <div>{formatPhone(c.telefone)}</div>
          {c.email && <div className="text-sm text-muted-foreground">{c.email}</div>}
        </div>
        <WhatsAppButton phone={c.telefone} />
      </Card>

      <h3 className="font-bold mb-2 mt-4">Veículos</h3>
      {(c.vehicles ?? []).length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">Nenhum veículo cadastrado.</Card>
      ) : (
        <div className="space-y-2">
          {c.vehicles!.map((v) => (
            <Link
              key={v.id}
              to="/veiculos/$vehicleId"
              params={{ vehicleId: v.id }}
              className="block"
            >
              <Card className="p-3 flex items-center gap-3 hover:border-primary">
                <PlacaBadge placa={v.placa} />
                <div className="text-sm">
                  {v.marca} {v.modelo} · {v.ano}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h3 className="font-bold mb-2 mt-4">Histórico de OS</h3>
      {(c.service_orders ?? []).length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">Nenhuma OS ainda.</Card>
      ) : (
        <div className="space-y-2">
          {c.service_orders!
            .slice()
            .sort(
              (a, b) => new Date(b.data_entrada).getTime() - new Date(a.data_entrada).getTime()
            )
            .map((o) => (
              <Link key={o.id} to="/os/$osId" params={{ osId: o.id }} className="block">
                <Card className="p-3 hover:border-primary">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {formatOSNumber(o.numero)}
                    </span>
                    <PlacaBadge placa={o.vehicles?.placa ?? ""} size="sm" />
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(o.data_entrada)}</span>
                    <span className="text-money font-bold">
                      {formatBRL(o.total_geral)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}