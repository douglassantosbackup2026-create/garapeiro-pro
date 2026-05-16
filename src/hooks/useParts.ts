import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";

export type Part = {
  id: string;
  workshop_id: string;
  nome: string;
  codigo: string | null;
  quantidade: number;
  estoque_minimo: number;
  custo_unitario: number;
  preco_venda: number;
  unidade: string;
  observacao: string | null;
  criada_em: string;
  atualizada_em: string;
};

export function useParts() {
  return useQuery({
    queryKey: ["parts_inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts_inventory")
        .select("*")
        .eq("workshop_id", getCurrentWorkshopId())
        .order("nome");
      if (error) throw error;
      return data as Part[];
    },
  });
}

export type PartInput = {
  nome: string;
  codigo?: string | null;
  quantidade: number;
  estoque_minimo: number;
  custo_unitario: number;
  preco_venda: number;
  unidade?: string;
  observacao?: string | null;
};

export function useUpsertPart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PartInput & { id?: string }) => {
      const payload = {
        workshop_id: getCurrentWorkshopId(),
        nome: input.nome,
        codigo: input.codigo ?? null,
        quantidade: input.quantidade,
        estoque_minimo: input.estoque_minimo,
        custo_unitario: input.custo_unitario,
        preco_venda: input.preco_venda,
        unidade: input.unidade ?? "un",
        observacao: input.observacao ?? null,
      };
      if (input.id) {
        const { data, error } = await supabase
          .from("parts_inventory")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("parts_inventory")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parts_inventory"] }),
  });
}

export function useDeletePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parts_inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parts_inventory"] }),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const { data: cur, error: e1 } = await supabase
        .from("parts_inventory")
        .select("quantidade")
        .eq("id", id)
        .single();
      if (e1) throw e1;
      const novo = Math.max(0, Number(cur.quantidade || 0) + delta);
      const { error } = await supabase
        .from("parts_inventory")
        .update({ quantidade: novo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parts_inventory"] }),
  });
}
