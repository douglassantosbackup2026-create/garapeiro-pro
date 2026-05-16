import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function useReturnAlerts() {
  return useQuery({
    queryKey: ["return_alerts"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const cutoffIso = new Date(Date.now() - NINETY_DAYS_MS).toISOString();
      const [{ data: clients }, { data: dismissed }] = await Promise.all([
        supabase
          .from("clients")
          .select(
            "id, nome, telefone, service_orders!inner(id, data_entrada, vehicles(placa, marca, modelo), service_order_services(descricao))"
          )
          .eq("workshop_id", getCurrentWorkshopId())
          .lt("service_orders.data_entrada", cutoffIso),
        supabase
          .from("dismissed_alerts")
          .select("client_id, dispensado_em")
          .eq("workshop_id", getCurrentWorkshopId()),
      ]);

      const now = Date.now();
      const dismissedSet = new Set(
        (dismissed ?? [])
          .filter((d) => now - new Date(d.dispensado_em).getTime() < DISMISS_TTL_MS)
          .map((d) => d.client_id)
      );

      const alerts: {
        clientId: string;
        nome: string;
        telefone: string;
        ultimoVeiculo: { placa: string; marca: string | null; modelo: string | null } | null;
        ultimoServico: string | null;
        diasSemVisita: number;
      }[] = [];

      for (const c of clients ?? []) {
        if (dismissedSet.has(c.id)) continue;
        const orders = (c.service_orders ?? []).slice().sort(
          (a, b) => new Date(b.data_entrada).getTime() - new Date(a.data_entrada).getTime()
        );
        if (!orders.length) continue;
        const last = orders[0];
        const dias = Math.floor((now - new Date(last.data_entrada).getTime()) / (24 * 60 * 60 * 1000));
        if (now - new Date(last.data_entrada).getTime() < NINETY_DAYS_MS) continue;
        alerts.push({
          clientId: c.id,
          nome: c.nome,
          telefone: c.telefone,
          ultimoVeiculo: last.vehicles ?? null,
          ultimoServico: last.service_order_services?.[0]?.descricao ?? null,
          diasSemVisita: dias,
        });
      }

      alerts.sort((a, b) => b.diasSemVisita - a.diasSemVisita);
      return alerts;
    },
  });
}

export function useDismissAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("dismissed_alerts")
        .insert({ workshop_id: getCurrentWorkshopId(), client_id: clientId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["return_alerts"] }),
  });
}