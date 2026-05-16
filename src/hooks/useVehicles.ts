import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import type { Database } from "@/integrations/supabase/types";

type VehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, clients(id, nome, telefone), service_orders(id, data_entrada)")
        .eq("workshop_id", getCurrentWorkshopId())
        .order("placa");
      if (error) throw error;
      return data;
    },
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ["vehicle", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          "*, clients(*), service_orders(*, service_order_services(*), service_order_parts(*))"
        )
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useVehicleByPlate() {
  return useMutation({
    mutationFn: async (placa: string) => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, clients(id, nome, telefone)")
        .eq("workshop_id", getCurrentWorkshopId())
        .ilike("placa", placa)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      client_id: string;
      placa: string;
      marca?: string | null;
      modelo?: string | null;
      ano?: number | null;
      cor?: string | null;
      km?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("vehicles")
        .insert({ ...input, workshop_id: getCurrentWorkshopId() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: VehicleUpdate }) => {
      const { error } = await supabase.from("vehicles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicle", vars.id] });
    },
  });
}