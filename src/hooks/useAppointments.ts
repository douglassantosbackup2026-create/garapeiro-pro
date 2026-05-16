import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";

export type Appointment = {
  id: string;
  workshop_id: string;
  client_id: string | null;
  vehicle_id: string | null;
  nome_cliente: string;
  telefone: string | null;
  servico_previsto: string | null;
  categoria: string | null;
  data_hora: string;
  duracao_min: number;
  status: string;
  os_id: string | null;
  observacoes: string | null;
  criada_em: string;
};

export type AppointmentStatus = "agendado" | "confirmado" | "em_andamento" | "concluido" | "cancelado" | "faltou";

export type AppointmentInput = {
  nome_cliente: string;
  telefone?: string | null;
  servico_previsto?: string | null;
  categoria?: string | null;
  data_hora: string;
  duracao_min?: number;
  observacoes?: string | null;
  client_id?: string | null;
  vehicle_id?: string | null;
};

export function useAppointments(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["appointments", dateFrom, dateTo],
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      let q = supabase
        .from("appointments")
        .select("*")
        .eq("workshop_id", getCurrentWorkshopId())
        .order("data_hora");
      if (dateFrom) q = q.gte("data_hora", dateFrom);
      if (dateTo) q = q.lt("data_hora", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...input, workshop_id: getCurrentWorkshopId(), duracao_min: input.duracao_min ?? 60 })
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AppointmentInput> & { id: string; status?: string; os_id?: string | null }) => {
      const { error } = await supabase.from("appointments").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
