import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import {
  CreateOSSchema,
  UpdateOSSchema,
  SatisfactionNotaSchema,
  parseOrThrow,
  type CreateOSInput,
  type UpdateOSInput,
  type OSPecaInput,
  type OSServicoInput,
  type SatisfactionNota,
} from "@/lib/schemas";
import type { Enums } from "@/integrations/supabase/types";

export type OSStatus = Enums<"os_status">;
export type { OSPecaInput, OSServicoInput, CreateOSInput, UpdateOSInput };

export function useServiceOrders() {
  return useQuery({
    queryKey: ["service_orders"],
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select(
          "*, clients(id, nome, telefone), vehicles(id, placa, marca, modelo), service_order_services(*), service_order_parts(*)",
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
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_orders")
        .select("*, clients(*), vehicles(*), service_order_services(*), service_order_parts(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOSInput) => {
      const valid = parseOrThrow(CreateOSSchema, input);
      const total_servicos = valid.servicos.reduce((s, x) => s + Number(x.valor || 0), 0);
      const total_pecas = valid.pecas.reduce(
        (s, x) => s + Number(x.quantidade || 0) * Number(x.valor_unitario || 0),
        0,
      );
      const { data: os, error } = await supabase
        .from("service_orders")
        .insert({
          workshop_id: getCurrentWorkshopId(),
          numero: 0,
          vehicle_id: valid.vehicle_id,
          client_id: valid.client_id,
          km_entrada: valid.km_entrada ?? null,
          previsao_entrega: valid.previsao_entrega ?? null,
          forma_pagamento: valid.forma_pagamento ?? null,
          observacoes: valid.observacoes ?? null,
          vencimento_fiado: valid.vencimento_fiado ?? null,
          categoria: valid.categoria ?? null,
          total_servicos,
          total_pecas,
          total_geral: total_servicos + total_pecas,
        })
        .select()
        .single();
      if (error) throw error;

      if (valid.servicos.length) {
        const { error: e2 } = await supabase.from("service_order_services").insert(
          valid.servicos.map((s, i) => ({
            service_order_id: os.id,
            descricao: s.descricao,
            valor: s.valor,
            ordem: i,
          })),
        );
        if (e2) throw e2;
      }
      if (valid.pecas.length) {
        const { error: e3 } = await supabase.from("service_order_parts").insert(
          valid.pecas.map((p, i) => ({
            service_order_id: os.id,
            nome: p.nome,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.quantidade * p.valor_unitario,
            custo_unitario: p.custo_unitario ?? 0,
            inventory_id: p.inventory_id ?? null,
            ordem: i,
          })),
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

export function useUpdateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateOSInput) => {
      const valid = parseOrThrow(UpdateOSSchema, input);
      const total_servicos = valid.servicos.reduce((s, x) => s + Number(x.valor || 0), 0);
      const total_pecas = valid.pecas.reduce(
        (s, x) => s + Number(x.quantidade || 0) * Number(x.valor_unitario || 0),
        0,
      );
      const { error } = await supabase
        .from("service_orders")
        .update({
          previsao_entrega: valid.previsao_entrega ?? null,
          forma_pagamento: valid.forma_pagamento ?? null,
          observacoes: valid.observacoes ?? null,
          vencimento_fiado: valid.vencimento_fiado ?? null,
          km_entrada: valid.km_entrada ?? null,
          total_servicos,
          total_pecas,
          total_geral: total_servicos + total_pecas,
        })
        .eq("id", valid.id);
      if (error) throw error;

      await supabase.from("service_order_services").delete().eq("service_order_id", valid.id);
      await supabase.from("service_order_parts").delete().eq("service_order_id", valid.id);

      if (valid.servicos.length) {
        const { error: e2 } = await supabase.from("service_order_services").insert(
          valid.servicos.map((s, i) => ({
            service_order_id: valid.id,
            descricao: s.descricao,
            valor: s.valor,
            ordem: i,
          })),
        );
        if (e2) throw e2;
      }
      if (valid.pecas.length) {
        const { error: e3 } = await supabase.from("service_order_parts").insert(
          valid.pecas.map((p, i) => ({
            service_order_id: valid.id,
            nome: p.nome,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.quantidade * p.valor_unitario,
            custo_unitario: p.custo_unitario ?? 0,
            inventory_id: p.inventory_id ?? null,
            ordem: i,
          })),
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
    mutationFn: async ({ id, nota }: { id: string; nota: SatisfactionNota }) => {
      const validNota = parseOrThrow(SatisfactionNotaSchema, nota);
      const { error } = await supabase
        .from("service_orders")
        .update({ nota_satisfacao: validNota })
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
      const { error } = await supabase.from("service_orders").update({ status }).eq("id", id);
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
