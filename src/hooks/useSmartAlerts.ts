import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SmartAlertSchema, type SmartAlert } from "@/lib/schemas";

export type { SmartAlert };

const SmartAlertsListSchema = z.array(SmartAlertSchema);

export function useSmartAlerts() {
  return useQuery({
    queryKey: ["smart_alerts"],
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_smart_alerts");
      if (error) throw error;
      const parsed = SmartAlertsListSchema.safeParse(data ?? []);
      if (!parsed.success) {
        console.error("[smart_alerts] invalid RPC payload", parsed.error);
        return [] as SmartAlert[];
      }
      return parsed.data;
    },
  });
}
