import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";

export type CatalogItem = {
  id: string;
  workshop_id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  preco_padrao: number | null;
  duracao_estimada_min: number | null;
  ativo: boolean;
  criada_em: string;
};

type CatalogInput = {
  nome: string;
  descricao?: string | null;
  categoria: string;
  preco_padrao?: number | null;
  duracao_estimada_min?: number | null;
  ativo?: boolean;
};

export function useServicesCatalog() {
  return useQuery({
    queryKey: ["services_catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services_catalog")
        .select("*")
        .eq("workshop_id", getCurrentWorkshopId())
        .order("categoria")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as CatalogItem[];
    },
  });
}

export function useCreateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CatalogInput) => {
      const { data, error } = await supabase
        .from("services_catalog")
        .insert({ ...input, workshop_id: getCurrentWorkshopId() })
        .select()
        .single();
      if (error) throw error;
      return data as CatalogItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services_catalog"] }),
  });
}

export function useUpdateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CatalogInput> & { id: string }) => {
      const { error } = await supabase.from("services_catalog").update(patch).eq("id", id);
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
