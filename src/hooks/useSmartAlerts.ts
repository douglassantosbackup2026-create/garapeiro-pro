import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SmartAlert =
  | {
      tipo: "retorno";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      diasSemVisita: number;
      veiculo: string | null;
      placa: string | null;
    }
  | {
      tipo: "revisao_km";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      veiculo: string;
      placa: string;
      kmAtual: number;
      kmProxima: number;
    }
  | {
      tipo: "revisao_tempo";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      veiculo: string;
      placa: string;
      mesesDesde: number;
    }
  | {
      tipo: "aniversario";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      diasParaAniversario: number;
    }
  | {
      tipo: "satisfacao";
      key: string;
      clientId: string;
      nome: string;
      telefone: string;
      osId: string;
      osNumero: number;
      diasDesdeEntrega: number;
    };

export function useSmartAlerts() {
  return useQuery({
    queryKey: ["smart_alerts"],
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_smart_alerts");
      if (error) throw error;
      return (data ?? []) as SmartAlert[];
    },
  });
}
