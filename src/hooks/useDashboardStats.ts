import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [osHoje, aReceber, vehicles, clients, recent] = await Promise.all([
        supabase
          .from("service_orders")
          .select("id", { count: "exact", head: true })
          .eq("workshop_id", getCurrentWorkshopId())
          .gte("data_entrada", startOfDay.toISOString()),
        supabase
          .from("service_orders")
          .select("id, total_geral")
          .eq("workshop_id", getCurrentWorkshopId())
          .neq("status", "cancelado"),
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("workshop_id", getCurrentWorkshopId()),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("workshop_id", getCurrentWorkshopId()),
        supabase
          .from("service_orders")
          .select(
            "id, numero, status, total_geral, data_entrada, clients(nome), vehicles(placa), service_order_services(descricao)",
          )
          .eq("workshop_id", getCurrentWorkshopId())
          .order("criada_em", { ascending: false })
          .limit(5),
      ]);

      const orderIds = (aReceber.data ?? []).map((r) => r.id);
      const paidByOs = new Map<string, number>();
      if (orderIds.length) {
        const { data: pays } = await supabase
          .from("payments")
          .select("service_order_id, valor")
          .in("service_order_id", orderIds);
        for (const p of pays ?? []) {
          paidByOs.set(
            p.service_order_id,
            (paidByOs.get(p.service_order_id) ?? 0) + Number(p.valor || 0),
          );
        }
      }
      const total = (aReceber.data ?? []).reduce((s, r) => {
        const pago = paidByOs.get(r.id) ?? 0;
        return s + Math.max(0, Number(r.total_geral || 0) - pago);
      }, 0);

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
