import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import { CatalogItemSchema, parseOrThrow, type CatalogItemInput } from "@/lib/schemas";
import type { Tables } from "@/integrations/supabase/types";

export type CatalogItem = Tables<"services_catalog">;

export function useServicesCatalog() {
  return useQuery({
    queryKey: ["services_catalog"],
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services_catalog")
        .select("*")
        .eq("workshop_id", getCurrentWorkshopId())
        .order("categoria")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CatalogItemInput) => {
      const valid = parseOrThrow(CatalogItemSchema, input);
      const { data, error } = await supabase
        .from("services_catalog")
        .insert({ ...valid, workshop_id: getCurrentWorkshopId() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services_catalog"] }),
  });
}

export function useUpdateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CatalogItemInput> & { id: string }) => {
      const valid = parseOrThrow(CatalogItemSchema.partial(), patch);
      const { error } = await supabase.from("services_catalog").update(valid).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services_catalog"] }),
  });
}

export function useDeleteCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services_catalog"] }),
  });
}
