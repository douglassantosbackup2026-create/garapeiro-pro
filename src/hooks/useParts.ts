import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import { parseOrThrow, PartSchema, type PartInput } from "@/lib/schemas";
import type { Tables } from "@/integrations/supabase/types";

export type Part = Tables<"parts_inventory">;

export function useParts() {
  return useQuery({
    queryKey: ["parts_inventory"],
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts_inventory")
        .select("*")
        .eq("workshop_id", getCurrentWorkshopId())
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertPart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PartInput) => {
      const valid = parseOrThrow(PartSchema, input);
      const payload = {
        workshop_id: getCurrentWorkshopId(),
        nome: valid.nome,
        codigo: valid.codigo ?? null,
        quantidade: valid.quantidade,
        estoque_minimo: valid.estoque_minimo,
        custo_unitario: valid.custo_unitario,
        preco_venda: valid.preco_venda,
        unidade: valid.unidade ?? "un",
        observacao: valid.observacao ?? null,
      };
      if (valid.id) {
        const { data, error } = await supabase
          .from("parts_inventory")
          .update(payload)
          .eq("id", valid.id)
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
