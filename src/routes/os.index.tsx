import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { PlacaBadge } from "@/components/PlacaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { EmptyState } from "@/components/EmptyState";
import { formatBRL, formatDate, formatOSNumber } from "@/lib/format";
import { CATEGORY_GROUPS, getGroupLabel } from "@/lib/service-categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/os/")({ component: OSList });

const FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "aguardando_aprovacao", label: "Aguardando" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "entregue", label: "Entregue" },
] as const;

function OSList() {
  const { data: orders } = useServiceOrders();
  const [filter, setFilter] = useState<string>("todas");
  const [catFilter, setCatFilter] = useState<string>("todas");
  const [q, setQ] = useState("");

  const filtered = (orders ?? []).filter((o) => {
    if (filter !== "todas" && o.status !== filter) return false;
    if (catFilter !== "todas") {
      const group = CATEGORY_GROUPS.find((g) => g.key === catFilter);
      if (!group) return false;
      const vals = group.subcategories.map((s) => s.value);
      const osCat = (o as { categoria?: string | null }).categoria;
      if (!osCat || !vals.includes(osCat as never)) return false;
    }
    if (q) {
      const s = q.toLowerCase();
      const placa = o.vehicles?.placa?.toLowerCase() ?? "";
      const cliente = o.clients?.nome?.toLowerCase() ?? "";
      const num = String(o.numero);
      if (!placa.includes(s) && !cliente.includes(s) && !num.includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Link to="/os/nova">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Nova OS
          </Button>
        </Link>
      </header>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Placa, cliente ou nº da OS"
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 mb-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
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

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setCatFilter("todas")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            catFilter === "todas"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border"
          )}
        >
          Todas categorias
        </button>
        {CATEGORY_GROUPS.filter((g) => g.key !== "outros").map((g) => (
          <button
            key={g.key}
            onClick={() => setCatFilter(g.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              catFilter === g.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Nenhuma OS aqui"
          description="Crie sua primeira ordem de serviço agora!"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <Link key={o.id} to="/os/$osId" params={{ osId: o.id }} className="block">
              <Card className="p-3 hover:border-primary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-bold text-muted-foreground">
                        {formatOSNumber(o.numero)}
                      </span>
                      <PlacaBadge placa={o.vehicles?.placa ?? ""} size="sm" />
                      <StatusBadge status={o.status} />
                      {(o as { categoria?: string | null }).categoria && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                          {getGroupLabel((o as { categoria?: string | null }).categoria!)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium truncate">{o.clients?.nome}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {o.service_order_services?.[0]?.descricao ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Entrada: {formatDate(o.data_entrada)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-money font-bold">{formatBRL(o.total_geral)}</div>
                    <WhatsAppButton phone={o.clients?.telefone ?? ""} className="mt-1" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}