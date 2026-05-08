import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Car, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useVehicles } from "@/hooks/useVehicles";
import { PlacaBadge } from "@/components/PlacaBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/veiculos/")({ component: Veiculos });

function Veiculos() {
  const { data: vehicles } = useVehicles();
  const [q, setQ] = useState("");
  const filtered = (vehicles ?? []).filter((v) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      v.placa.toLowerCase().includes(s) ||
      (v.modelo ?? "").toLowerCase().includes(s) ||
      (v.marca ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Veículos</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Placa, marca ou modelo"
          className="pl-9"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Car} title="Nenhum veículo cadastrado" description="Cadastre um veículo criando uma OS." />
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => {
            const ultimaVisita = v.service_orders?.[0]?.data_entrada;
            return (
              <Link
                key={v.id}
                to="/veiculos/$vehicleId"
                params={{ vehicleId: v.id }}
                className="block"
              >
                <Card className="p-3 flex items-center gap-3 hover:border-primary">
                  <PlacaBadge placa={v.placa} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {v.marca} {v.modelo} · {v.ano}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {v.clients?.nome} · {v.service_orders?.length ?? 0} OS
                      {ultimaVisita ? ` · última: ${formatDate(ultimaVisita)}` : ""}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}