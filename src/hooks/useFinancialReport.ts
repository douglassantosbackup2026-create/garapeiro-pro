import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";

export type DiaFat = { dia: string; valor: number };
export type Top = { nome: string; valor: number; qtd: number };

export function useFinancialReport() {
  return useQuery({
    queryKey: ["financial_report"],
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const inicioMesPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const fimMesPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const [{ data: paysMes }, { data: paysPrev }, { data: osMes }, { data: aReceber }] =
        await Promise.all([
          supabase
            .from("payments")
            .select("valor, recebido_em, service_orders(id, client_id, clients(nome))")
            .eq("workshop_id", getCurrentWorkshopId())
            .gte("recebido_em", inicioMes.toISOString()),
          supabase
            .from("payments")
            .select("valor")
            .eq("workshop_id", getCurrentWorkshopId())
            .gte("recebido_em", inicioMesPrev.toISOString())
            .lte("recebido_em", fimMesPrev.toISOString()),
          supabase
            .from("service_orders")
            .select(
              "id, total_geral, data_entrada, client_id, clients(nome), service_order_services(descricao, valor)"
            )
            .eq("workshop_id", getCurrentWorkshopId())
            .gte("data_entrada", inicioMes.toISOString())
            .neq("status", "cancelado"),
          supabase
            .from("service_orders")
            .select("id, total_geral")
            .eq("workshop_id", getCurrentWorkshopId())
            .neq("status", "cancelado"),
        ]);

      const faturamento = (paysMes ?? []).reduce((s, p) => s + Number(p.valor || 0), 0);
      const faturamentoPrev = (paysPrev ?? []).reduce(
        (s, p) => s + Number(p.valor || 0),
        0
      );
      const variacao =
        faturamentoPrev > 0 ? ((faturamento - faturamentoPrev) / faturamentoPrev) * 100 : 0;

      // OS no mês: contagem e ticket médio
      const osCount = (osMes ?? []).length;
      const totalOS = (osMes ?? []).reduce((s, o) => s + Number(o.total_geral || 0), 0);
      const ticketMedio = osCount > 0 ? totalOS / osCount : 0;

      // A receber real (total - pagamentos)
      const ids = (aReceber ?? []).map((r) => r.id);
      const paidMap = new Map<string, number>();
      if (ids.length) {
        const { data: pays } = await supabase
          .from("payments")
          .select("service_order_id, valor")
          .in("service_order_id", ids);
        for (const p of pays ?? []) {
          paidMap.set(
            p.service_order_id,
            (paidMap.get(p.service_order_id) ?? 0) + Number(p.valor || 0)
          );
        }
      }
      const receber = (aReceber ?? []).reduce((s, r) => {
        return s + Math.max(0, Number(r.total_geral || 0) - (paidMap.get(r.id) ?? 0));
      }, 0);

      // OS por dia (últimos 30 dias)
      const dias: DiaFat[] = [];
      const map = new Map<string, number>();
      for (const p of paysMes ?? []) {
        const d = new Date(p.recebido_em).toISOString().slice(0, 10);
        map.set(d, (map.get(d) ?? 0) + Number(p.valor || 0));
      }
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dias.push({ dia: key, valor: map.get(key) ?? 0 });
      }

      // Top clientes do mês
      const clienteMap = new Map<string, { nome: string; valor: number; qtd: number }>();
      for (const o of osMes ?? []) {
        const nome = o.clients?.nome ?? "—";
        const cur = clienteMap.get(nome) ?? { nome, valor: 0, qtd: 0 };
        cur.valor += Number(o.total_geral || 0);
        cur.qtd += 1;
        clienteMap.set(nome, cur);
      }
      const topClientes = Array.from(clienteMap.values())
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

      // Top serviços do mês
      const servMap = new Map<string, { nome: string; valor: number; qtd: number }>();
      for (const o of osMes ?? []) {
        for (const s of o.service_order_services ?? []) {
          const cur = servMap.get(s.descricao) ?? {
            nome: s.descricao,
            valor: 0,
            qtd: 0,
          };
          cur.valor += Number(s.valor || 0);
          cur.qtd += 1;
          servMap.set(s.descricao, cur);
        }
      }
      const topServicos = Array.from(servMap.values())
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 5);

      return {
        faturamento,
        faturamentoPrev,
        variacao,
        osCount,
        ticketMedio,
        aReceber: receber,
        dias,
        topClientes,
        topServicos,
      };
    },
  });
}
