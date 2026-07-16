import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import {
  ClientSchema,
  ClientUpdateSchema,
  parseOrThrow,
  type ClientInput,
  type ClientUpdateInput,
} from "@/lib/schemas";

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, vehicles(id, placa, modelo, marca), service_orders(id, data_entrada, status)")
        .eq("workshop_id", getCurrentWorkshopId())
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["client", id],
    enabled: !!id,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, vehicles(*), service_orders(*, vehicles(placa, marca, modelo))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput) => {
      const valid = parseOrThrow(ClientSchema, input);
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...valid, workshop_id: getCurrentWorkshopId() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ClientUpdateInput }) => {
      const valid = parseOrThrow(ClientUpdateSchema, patch);
      const { error } = await supabase.from("clients").update(valid).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", vars.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}
