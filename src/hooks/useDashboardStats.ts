import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_WORKSHOP_ID } from "@/lib/workshop";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [osHoje, aReceber, vehicles, clients, recent] = await Promise.all([
        supabase
          .from("service_orders")
          .select("id", { count: "exact", head: true })
          .eq("workshop_id", DEFAULT_WORKSHOP_ID)
          .gte("data_entrada", startOfDay.toISOString()),
        supabase
          .from("service_orders")
          .select("total_geral")
          .eq("workshop_id", DEFAULT_WORKSHOP_ID)
          .not("status", "in", "(entregue,cancelado)"),
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("workshop_id", DEFAULT_WORKSHOP_ID),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("workshop_id", DEFAULT_WORKSHOP_ID),
        supabase
          .from("service_orders")
          .select(
            "id, numero, status, total_geral, data_entrada, clients(nome), vehicles(placa), service_order_services(descricao)"
          )
          .eq("workshop_id", DEFAULT_WORKSHOP_ID)
          .order("criada_em", { ascending: false })
          .limit(5),
      ]);

      const total = (aReceber.data ?? []).reduce(
        (s, r: { total_geral: number | string }) => s + Number(r.total_geral || 0),
        0
      );

      return {
        osHoje: osHoje.count ?? 0,
        aReceber: total,
        veiculos: vehicles.count ?? 0,
        clientes: clients.count ?? 0,
        recentes: recent.data ?? [],
      };
    },
  });
}