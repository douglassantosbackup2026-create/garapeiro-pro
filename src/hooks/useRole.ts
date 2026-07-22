import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Enums } from "@/integrations/supabase/types";

export type AppRole = Enums<"app_role">;

/**
 * Retorna o(s) papel(is) do usuário logado na oficina atual.
 * Enquanto carrega, `isDono` é `false` — trate telas gated com skeleton
 * ou aguarde `isLoading` para evitar flash de conteúdo vetado.
 */
export function useRole() {
  const { user, profile } = useAuth();
  const wsId = profile?.workshop_id ?? null;
  const q = useQuery({
    queryKey: ["user_roles", user?.id, wsId],
    enabled: !!user?.id && !!wsId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("workshop_id", wsId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
  const roles = q.data ?? [];
  return {
    roles,
    isDono: roles.includes("dono"),
    isMecanico: roles.includes("mecanico"),
    isLoading: q.isLoading,
  };
}