import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Wrench,
  DollarSign,
  Car,
  Users,
  Plus,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useReturnAlerts, useDismissAlert } from "@/hooks/useReturnAlerts";
import { useWorkshop } from "@/hooks/useWorkshop";
import { PlacaBadge } from "@/components/PlacaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  formatBRL,
  formatLongDate,
  formatOSNumber,
  getGreeting,
} from "@/lib/format";
import { renderRetorno } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats();
  const { data: alerts } = useReturnAlerts();
  const { data: workshop } = useWorkshop();
  const dismiss = useDismissAlert();
  const [fabOpen, setFabOpen] = useState(false);
  const alertCount = alerts?.length ?? 0;

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {getGreeting()},{" "}
            <span className="text-primary">{workshop?.nome ?? "Mecânico"}</span>
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {formatLongDate()}
          </p>
        </div>
        <Link
          to="/alertas"
          className="relative p-2 rounded-md hover:bg-muted"
          aria-label="Alertas"
        >
          <Bell className="h-6 w-6" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </Link>
      </header>

      {/* Cards 2x2 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={Wrench}
          label="Hoje"
          value={stats?.osHoje ?? 0}
          tone="bg-primary/10 text-primary"
        />
        <StatCard
          icon={DollarSign}
          label="A receber"
          value={formatBRL(stats?.aReceber ?? 0)}
          tone="bg-money/10 text-money"
          isMoney
        />
        <StatCard
          icon={Car}
          label="Veículos"
          value={stats?.veiculos ?? 0}
          tone="bg-status-progress/30 text-status-progress-foreground"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={stats?.clientes ?? 0}
          tone="bg-status-part/30 text-status-part-foreground"
        />
      </div>

      {/* OS recentes */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">OS Recentes</h2>
          <Link to="/os" className="text-sm text-primary font-medium">
            Ver todas →
          </Link>
        </div>
        <div className="space-y-2">
          {(stats?.recentes ?? []).length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma OS ainda. Comece criando uma agora!
            </Card>
          ) : (
            stats?.recentes.map((os) => (
              <Link
                key={os.id}
                to="/os/$osId"
                params={{ osId: os.id }}
                className="block"
              >
                <Card className="p-3 flex items-center gap-3 hover:border-primary transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-muted-foreground">
                        {formatOSNumber(os.numero)}
                      </span>
                      <PlacaBadge placa={os.vehicles?.placa ?? ""} size="sm" />
                    </div>
                    <div className="text-sm font-medium truncate">
                      {os.clients?.nome}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-money font-bold text-sm">
                      {formatBRL(os.total_geral)}
                    </div>
                    <StatusBadge status={os.status} className="mt-1" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Alertas */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Alertas de Retorno
          </h2>
          <Link to="/alertas" className="text-sm text-primary font-medium">
            Ver todos →
          </Link>
        </div>
        {alertCount === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhum cliente para contatar agora. 👍
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts!.slice(0, 3).map((a) => (
              <Card key={a.clientId} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.diasSemVisita} dias sem visita
                      {a.ultimoVeiculo
                        ? ` · ${a.ultimoVeiculo.marca} ${a.ultimoVeiculo.modelo}`
                        : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
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
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismiss.mutate(a.clientId)}
                    >
                      Dispensar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => setFabOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Adicionar"
      >
        <Plus className="h-7 w-7" />
      </button>
      <button
        onClick={() => setFabOpen(true)}
        className="hidden md:flex fixed bottom-6 right-6 z-30 h-14 px-5 rounded-full bg-primary text-primary-foreground shadow-lg items-center gap-2 font-semibold hover:scale-105 transition-transform"
      >
        <Plus className="h-5 w-5" />
        Adicionar
      </button>

      <Dialog open={fabOpen} onOpenChange={setFabOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>O que você quer criar?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 mt-2">
            <Button
              size="lg"
              className="justify-start gap-3"
              onClick={() => {
                setFabOpen(false);
                navigate({ to: "/os/nova" });
              }}
            >
              <Wrench className="h-5 w-5" /> Nova Ordem de Serviço
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="justify-start gap-3"
              onClick={() => {
                setFabOpen(false);
                navigate({ to: "/clientes", search: { novo: 1 } as never });
              }}
            >
              <Users className="h-5 w-5" /> Novo Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  isMoney,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone: string;
  isMoney?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${tone} mb-2`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className={`font-display font-bold ${isMoney ? "text-xl" : "text-2xl"} mt-0.5`}>
        {value}
      </div>
    </Card>
  );
}
