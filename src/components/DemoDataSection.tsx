import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Só apareça para donos: o botão inclui grava/apaga dados escopados por RLS. */
export function DemoDataSection() {
  const qc = useQueryClient();
  const [pending, setPending] = useState<"seed" | "clear" | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const invalidateAll = () => {
    [
      "clients",
      "vehicles",
      "service_orders",
      "parts",
      "payments",
      "appointments",
      "smart_alerts",
      "return_alerts",
      "dashboard_stats",
      "financial_report",
    ].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };

  const run = async (action: "seed" | "clear") => {
    setPending(action);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-data", {
        body: { action },
      });
      if (error) throw error;
      const payload = data as { ok?: boolean; error?: string; created?: number; deleted?: number };
      if (payload?.error) throw new Error(payload.error);
      if (action === "seed") {
        toast.success(`Ambiente populado com ${payload.created ?? 0} registros de exemplo.`);
      } else {
        toast.success(`${payload.deleted ?? 0} registros de demonstração removidos.`);
      }
      invalidateAll();
    } catch (err) {
      toast.error((err as Error).message || "Falha ao executar operação");
    } finally {
      setPending(null);
      setConfirmClear(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Ambiente de demonstração</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Popule sua oficina com clientes, veículos e ordens de serviço fictícios para
            testar a plataforma. Todos os registros são marcados com <code>[DEMO]</code> e
            podem ser removidos depois com um clique.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => run("seed")}
        >
          {pending === "seed" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Popular com dados de demonstração
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending !== null}
          onClick={() => setConfirmClear(true)}
        >
          {pending === "clear" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Limpar dados de demonstração
        </Button>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover dados de demonstração?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apaga apenas os registros marcados com <code>[DEMO]</code>. Clientes,
              veículos e ordens reais permanecem intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => run("clear")}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}