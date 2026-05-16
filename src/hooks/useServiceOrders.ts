import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import type { Database } from "@/integrations/supabase/types";

export type OSStatus = Database["public"]["Enums"]["os_status"];

export type OSPecaInput = {
  nome: string;
  quantidade: number;
  valor_unitario: number;
  custo_unitario?: number;
  inventory_id?: string | null;
};

export type OSServicoInput = { descricao: string; valor: number };

export function useServiceOrders() {
  return useQuery({
    queryKey: ["service_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select(
          "*, clients(id, nome, telefone), vehicles(id, placa, marca, modelo), service_order_services(*), service_order_parts(*)"
        )
        .eq("workshop_id", getCurrentWorkshopId())
        .order("criada_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useServiceOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["service_order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select(
          "*, clients(*), vehicles(*), service_order_services(*), service_order_parts(*)"
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

type CreateOSInput = {
  vehicle_id: string;
  client_id: string;
  km_entrada?: number | null;
  previsao_entrega?: string | null;
  forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"] | null;
  observacoes?: string | null;
  vencimento_fiado?: string | null;
  servicos: OSServicoInput[];
  pecas: OSPecaInput[];
};

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOSInput) => {
      const total_servicos = input.servicos.reduce((s, x) => s + Number(x.valor || 0), 0);
      const total_pecas = input.pecas.reduce(
        (s, x) => s + Number(x.quantidade || 0) * Number(x.valor_unitario || 0),
        0
      );
      const { data: os, error } = await supabase
        .from("service_orders")
        .insert({
          workshop_id: getCurrentWorkshopId(),
          numero: 0,
          vehicle_id: input.vehicle_id,
          client_id: input.client_id,
          km_entrada: input.km_entrada ?? null,
          previsao_entrega: input.previsao_entrega ?? null,
          forma_pagamento: input.forma_pagamento ?? null,
          observacoes: input.observacoes ?? null,
          vencimento_fiado: input.vencimento_fiado ?? null,
          total_servicos,
          total_pecas,
          total_geral: total_servicos + total_pecas,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.servicos.length) {
        const { error: e2 } = await supabase.from("service_order_services").insert(
          input.servicos.map((s, i) => ({
            service_order_id: os.id,
            descricao: s.descricao,
            valor: s.valor,
            ordem: i,
          }))
        );
        if (e2) throw e2;
      }
      if (input.pecas.length) {
        const { error: e3 } = await supabase.from("service_order_parts").insert(
          input.pecas.map((p, i) => ({
            service_order_id: os.id,
            nome: p.nome,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.quantidade * p.valor_unitario,
            custo_unitario: p.custo_unitario ?? 0,
            inventory_id: p.inventory_id ?? null,
            ordem: i,
          }))
        );
        if (e3) throw e3;
      }
      return os;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service_orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

type UpdateOSInput = {
  id: string;
  previsao_entrega?: string | null;
  forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"] | null;
  observacoes?: string | null;
  vencimento_fiado?: string | null;
  km_entrada?: number | null;
  servicos: OSServicoInput[];
  pecas: OSPecaInput[];
};

export function useUpdateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateOSInput) => {
      const total_servicos = input.servicos.reduce((s, x) => s + Number(x.valor || 0), 0);
      const total_pecas = input.pecas.reduce(
        (s, x) => s + Number(x.quantidade || 0) * Number(x.valor_unitario || 0),
        0
      );
      const { error } = await supabase
        .from("service_orders")
        .update({
          previsao_entrega: input.previsao_entrega ?? null,
          forma_pagamento: input.forma_pagamento ?? null,
          observacoes: input.observacoes ?? null,
          vencimento_fiado: input.vencimento_fiado ?? null,
          km_entrada: input.km_entrada ?? null,
          total_servicos,
          total_pecas,
          total_geral: total_servicos + total_pecas,
        })
        .eq("id", input.id);
      if (error) throw error;

      await supabase.from("service_order_services").delete().eq("service_order_id", input.id);
      await supabase.from("service_order_parts").delete().eq("service_order_id", input.id);

      if (input.servicos.length) {
        const { error: e2 } = await supabase.from("service_order_services").insert(
          input.servicos.map((s, i) => ({
            service_order_id: input.id,
            descricao: s.descricao,
            valor: s.valor,
            ordem: i,
          }))
        );
        if (e2) throw e2;
      }
      if (input.pecas.length) {
        const { error: e3 } = await supabase.from("service_order_parts").insert(
          input.pecas.map((p, i) => ({
            service_order_id: input.id,
            nome: p.nome,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.quantidade * p.valor_unitario,
            custo_unitario: p.custo_unitario ?? 0,
            inventory_id: p.inventory_id ?? null,
            ordem: i,
          }))
        );
        if (e3) throw e3;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["service_orders"] });
      qc.invalidateQueries({ queryKey: ["service_order", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["financeiro"] });
    },
  });
}

export function useUpdateSatisfaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nota }: { id: string; nota: number | null }) => {
      const { error } = await supabase
        .from("service_orders")
        .update({ nota_satisfacao: nota })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["service_order", vars.id] });
      qc.invalidateQueries({ queryKey: ["smart_alerts"] });
    },
  });
}

export function useUpdateOSStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OSStatus }) => {
      const { error } = await supabase
        .from("service_orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["service_orders"] });
      qc.invalidateQueries({ queryKey: ["service_order", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["parts_inventory"] });
      qc.invalidateQueries({ queryKey: ["smart_alerts"] });
    },
  });
}