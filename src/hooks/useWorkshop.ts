import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_WORKSHOP_ID } from "@/lib/workshop";

export function useWorkshop() {
  return useQuery({
    queryKey: ["workshop"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .eq("id", DEFAULT_WORKSHOP_ID)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateWorkshop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase
        .from("workshops")
        .update(patch)
        .eq("id", DEFAULT_WORKSHOP_ID);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workshop"] }),
  });
}