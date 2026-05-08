import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_WORKSHOP_ID } from "@/lib/workshop";

const DAY = 24 * 60 * 60 * 1000;

export type SmartAlert =
  | {
      tipo: "retorno";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      diasSemVisita: number;
      veiculo: string | null;
      placa: string | null;
    }
  | {
      tipo: "revisao_km";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      veiculo: string;
      placa: string;
      kmAtual: number;
      kmProxima: number;
    }
  | {
      tipo: "revisao_tempo";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      veiculo: string;
      placa: string;
      mesesDesde: number;
    }
  | {
      tipo: "aniversario";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      diasParaAniversario: number;
    }
  | {
      tipo: "satisfacao";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      osNumero: number;
      diasDesdeEntrega: number;
    };

export function useSmartAlerts() {
  return useQuery({
    queryKey: ["smart_alerts"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const cutoffRetorno = new Date(Date.now() - 90 * DAY).toISOString();
      const cutoffEntrega = new Date(Date.now() - 1 * DAY).toISOString();
      const cutoffEntregaMax = new Date(Date.now() - 7 * DAY).toISOString();

      const [{ data: clientsRaw }, { data: vehicles }, { data: dismissed }, { data: entregues }] =
        await Promise.all([
          supabase
            .from("clients")
            .select(
              "id, nome, telefone, data_aniversario, service_orders(id, data_entrada, vehicles(placa, marca, modelo))"
            )
            .eq("workshop_id", DEFAULT_WORKSHOP_ID),
          supabase
            .from("vehicles")
            .select(
              "id, placa, marca, modelo, km, km_proxima_revisao, data_ultima_revisao, intervalo_revisao_meses, client_id, clients(nome, telefone)"
            )
            .eq("workshop_id", DEFAULT_WORKSHOP_ID),
          supabase
            .from("dismissed_alerts")
            .select("client_id, dispensado_em")
            .eq("workshop_id", DEFAULT_WORKSHOP_ID),
          supabase
            .from("service_orders")
            .select("id, numero, atualizada_em, client_id, clients(nome, telefone)")
            .eq("workshop_id", DEFAULT_WORKSHOP_ID)
            .eq("status", "entregue")
            .gte("atualizada_em", cutoffEntregaMax)
            .lte("atualizada_em", cutoffEntrega),
        ]);

      const now = Date.now();
      const dismissedSet = new Set(
        (dismissed ?? [])
          .filter((d) => now - new Date(d.dispensado_em).getTime() < 30 * DAY)
          .map((d) => d.client_id)
      );

      const alerts: SmartAlert[] = [];

      // 1) Retorno (>90 dias sem OS)
      for (const c of clientsRaw ?? []) {
        if (dismissedSet.has(c.id)) continue;
        const orders = (c.service_orders ?? [])
          .slice()
          .sort(
            (a, b) =>
              new Date(b.data_entrada).getTime() - new Date(a.data_entrada).getTime()
          );
        if (!orders.length) continue;
        const last = orders[0];
        if (new Date(last.data_entrada).toISOString() >= cutoffRetorno) continue;
        const dias = Math.floor((now - new Date(last.data_entrada).getTime()) / DAY);
        const v = last.vehicles;
        alerts.push({
          tipo: "retorno",
          key: `retorno:${c.id}`,
          clientId: c.id,
          nome: c.nome,
          telefone: c.telefone,
          diasSemVisita: dias,
          veiculo: v ? `${v.marca ?? ""} ${v.modelo ?? ""}`.trim() || null : null,
          placa: v?.placa ?? null,
        });
      }

      // 2) Revisão por KM e tempo
      for (const v of vehicles ?? []) {
        if (!v.clients) continue;
        if (dismissedSet.has(v.client_id)) continue;
        const veiculo = `${v.marca ?? ""} ${v.modelo ?? ""}`.trim() || "veículo";
        if (v.km_proxima_revisao && v.km && Number(v.km) >= Number(v.km_proxima_revisao) - 500) {
          alerts.push({
            tipo: "revisao_km",
            key: `revkm:${v.id}`,
            clientId: v.client_id,
            nome: v.clients.nome,
            telefone: v.clients.telefone,
            veiculo,
            placa: v.placa,
            kmAtual: Number(v.km),
            kmProxima: Number(v.km_proxima_revisao),
          });
        }
        if (v.data_ultima_revisao && v.intervalo_revisao_meses) {
          const meses =
            (now - new Date(v.data_ultima_revisao).getTime()) / (30 * DAY);
          if (meses >= Number(v.intervalo_revisao_meses)) {
            alerts.push({
              tipo: "revisao_tempo",
              key: `revtempo:${v.id}`,
              clientId: v.client_id,
              nome: v.clients.nome,
              telefone: v.clients.telefone,
              veiculo,
              placa: v.placa,
              mesesDesde: Math.floor(meses),
            });
          }
        }
      }

      // 3) Aniversários (próximos 7 dias)
      const hoje = new Date();
      for (const c of clientsRaw ?? []) {
        if (!c.data_aniversario || dismissedSet.has(c.id)) continue;
        const d = new Date(c.data_aniversario);
        const next = new Date(hoje.getFullYear(), d.getMonth(), d.getDate());
        if (next < hoje) next.setFullYear(hoje.getFullYear() + 1);
        const diff = Math.ceil((next.getTime() - hoje.getTime()) / DAY);
        if (diff <= 7) {
          alerts.push({
            tipo: "aniversario",
            key: `aniv:${c.id}`,
            clientId: c.id,
            nome: c.nome,
            telefone: c.telefone,
            diasParaAniversario: diff,
          });
        }
      }

      // 4) Satisfação pós-entrega (1-7 dias após status entregue)
      for (const o of entregues ?? []) {
        if (!o.clients) continue;
        if (dismissedSet.has(o.client_id)) continue;
        const dias = Math.floor((now - new Date(o.atualizada_em).getTime()) / DAY);
        alerts.push({
          tipo: "satisfacao",
          key: `sat:${o.id}`,
          clientId: o.client_id,
          nome: o.clients.nome,
          telefone: o.clients.telefone,
          osNumero: o.numero,
          diasDesdeEntrega: dias,
        });
      }

      return alerts;
    },
  });
}
