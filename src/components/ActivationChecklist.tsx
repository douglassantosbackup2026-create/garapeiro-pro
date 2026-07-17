import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useServicesCatalog } from "@/hooks/useServicesCatalog";
import { useWorkshop } from "@/hooks/useWorkshop";

const CHECKLIST_KEY = "oficinapro-onboarding-checklist-dismissed";

export function ActivationChecklist() {
  const { data: workshop } = useWorkshop();
  const { data: orders } = useServiceOrders();
  const { data: catalog } = useServicesCatalog();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(CHECKLIST_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const hasOS = (orders?.length ?? 0) > 0;
  const hasCatalog = (catalog?.length ?? 0) > 0;
  const hasWhatsAppTpl = Boolean(workshop?.mensagem_orcamento);
  const steps: { id: string; label: string; done: boolean; href: string }[] = [
    {
      id: "catalog",
      label: "Catálogo com serviços prontos",
      done: hasCatalog,
      href: "/servicos",
    },
    {
      id: "os",
      label: "Criar sua primeira OS",
      done: hasOS,
      href: "/os/nova",
    },
    {
      id: "status",
      label: "Atualizar status e avisar no WhatsApp",
      done: hasOS && (orders?.some((o) => o.status !== "aguardando_aprovacao") ?? false),
      href: "/os",
    },
    {
      id: "templates",
      label: "Personalizar mensagens WhatsApp",
      done: hasWhatsAppTpl,
      href: "/configuracoes",
    },
  ];

  const allDone = steps.every((s) => s.done);
  if (dismissed || allDone) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(CHECKLIST_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <Card className="p-4 mb-5 border-primary/30 bg-accent/40 relative">
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted text-muted-foreground"
        aria-label="Dispensar checklist"
      >
        <X className="h-4 w-4" />
      </button>
      <h2 className="font-display font-bold text-base mb-1">Comece em 3 minutos</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Checklist para ativar sua oficina e ver resultado no primeiro dia.
      </p>
      <ul className="space-y-2">
        {steps.map((s) => (
          <li key={s.id}>
            <Link
              to={s.href}
              className="flex items-center gap-2 text-sm hover:underline"
            >
              {s.done ? (
                <CheckCircle2 className="h-4 w-4 text-money shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={s.done ? "text-muted-foreground line-through" : "font-medium"}>
                {s.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!hasOS && (
        <Button asChild className="w-full mt-3" size="sm">
          <Link to="/os/nova">Criar primeira OS agora</Link>
        </Button>
      )}
    </Card>
  );
}
