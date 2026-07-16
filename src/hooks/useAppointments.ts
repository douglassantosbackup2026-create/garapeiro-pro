import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import { AppointmentSchema, parseOrThrow, type AppointmentInput } from "@/lib/schemas";
import type { Tables } from "@/integrations/supabase/types";

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "em_andamento"
  | "concluido"
  | "cancelado"
  | "faltou";

export type Appointment = Omit<Tables<"appointments">, "status"> & {
  status: AppointmentStatus;
};

export type { AppointmentInput };

const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  "agendado",
  "confirmado",
  "em_andamento",
  "concluido",
  "cancelado",
  "faltou",
] as const;

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

function mapAppointment(row: Tables<"appointments">): Appointment {
  return {
    ...row,
    status: isAppointmentStatus(row.status) ? row.status : "agendado",
  };
}

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
      return (data ?? []).map(mapAppointment);
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const valid = parseOrThrow(AppointmentSchema, input);
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          ...valid,
          workshop_id: getCurrentWorkshopId(),
          duracao_min: valid.duracao_min ?? 60,
        })
        .select()
        .single();
      if (error) throw error;
      return mapAppointment(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<AppointmentInput> & {
      id: string;
      status?: AppointmentStatus;
      os_id?: string | null;
    }) => {
      const { status, os_id, ...rest } = patch;
      const valid = parseOrThrow(AppointmentSchema.partial(), rest);
      const payload = {
        ...valid,
        ...(status !== undefined ? { status } : {}),
        ...(os_id !== undefined ? { os_id } : {}),
      };
      const { error } = await supabase.from("appointments").update(payload).eq("id", id);
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
