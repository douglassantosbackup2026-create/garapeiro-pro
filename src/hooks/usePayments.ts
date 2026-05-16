import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";
import type { Database } from "@/integrations/supabase/types";

export type FormaPagamento = Database["public"]["Enums"]["forma_pagamento"];

export type Payment = {
  id: string;
  service_order_id: string;
  valor: number;
  forma_pagamento: FormaPagamento | null;
  observacao: string | null;
  recebido_em: string;
};

export function usePaymentsByOS(osId: string | undefined) {
  return useQuery({
    queryKey: ["payments", osId],
    enabled: !!osId,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("service_order_id", osId!)
        .order("recebido_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
  });
}

export function useAllPayments() {
  return useQuery({
    queryKey: ["payments_all"],
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("service_order_id, valor")
        .eq("workshop_id", getCurrentWorkshopId());
      if (error) throw error;
      const map = new Map<string, number>();
      for (const p of data ?? []) {
        const cur = map.get(p.service_order_id) ?? 0;
        map.set(p.service_order_id, cur + Number(p.valor || 0));
      }
      return map;
    },
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      service_order_id: string;
      valor: number;
      forma_pagamento?: FormaPagamento | null;
      observacao?: string | null;
    }) => {
      const { error } = await supabase.from("payments").insert({
        workshop_id: getCurrentWorkshopId(),
        service_order_id: input.service_order_id,
        valor: input.valor,
        forma_pagamento: input.forma_pagamento ?? null,
        observacao: input.observacao ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["payments", vars.service_order_id] });
      qc.invalidateQueries({ queryKey: ["payments_all"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["financeiro"] });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; service_order_id: string }) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["payments", vars.service_order_id] });
      qc.invalidateQueries({ queryKey: ["payments_all"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["financeiro"] });
    },
  });
}

export function paymentStatus(total: number, paid: number): "pago" | "parcial" | "aberto" {
  if (paid <= 0) return "aberto";
  if (paid + 0.01 >= total) return "pago";
  return "parcial";
}