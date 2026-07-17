import { useEffect, useMemo, useRef, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkshop } from "@/hooks/useWorkshop";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { normalizePlano, PLANS, type PlanoId } from "@/lib/plans";
import { reportError } from "@/lib/reportError";
import { Check, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

let mpInitKey: string | null = null;

async function ensureMpInit(publicKey: string) {
  if (mpInitKey === publicKey) return;
  await initMercadoPago(publicKey, { locale: "pt-BR" });
  mpInitKey = publicKey;
}

type BrickFormData = {
  transaction_amount: number;
  token?: string;
  installments?: number;
  payment_method_id: string;
  issuer_id?: string | number;
  payer: {
    email: string;
    identification?: { type: string; number: string };
  };
};

export function PlanBillingSection({ highlightUpgrade = false }: { highlightUpgrade?: boolean }) {
  const { data: workshop, refetch } = useWorkshop();
  const { user } = useAuth();
  const plano = normalizePlano(workshop?.plano);
  const [target, setTarget] = useState<Exclude<PlanoId, "gratuito"> | null>(null);
  const [email, setEmail] = useState(user?.email ?? "");
  const [sdkReady, setSdkReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processRef = useRef<(formData: BrickFormData) => Promise<void>>(async () => undefined);

  const amountReais = target ? PLANS[target].priceCents / 100 : 0;

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error: err } = await supabase.functions.invoke("mercado-pago", {
          body: { action: "getPublicKey" },
        });
        if (err) throw err;
        const key = (data as { publicKey?: string })?.publicKey;
        if (!key) throw new Error("Chave pública indisponível");
        await ensureMpInit(key);
        if (!cancelled) setSdkReady(true);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target]);

  processRef.current = async (formData: BrickFormData) => {
    if (!target) return;
    setPaying(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("mercado-pago", {
        body: {
          action: "processPlanUpgrade",
          plano: target,
          formData: { ...formData, transaction_amount: amountReais },
          payerEmail: email.trim(),
        },
      });
      if (err) throw err;
      const result = data as { status?: string; error?: string };
      if (result.error) throw new Error(result.error);
      if (result.status === "approved" || result.status === "authorized") {
        toast.success(`Plano ${PLANS[target].name} ativado!`);
        setTarget(null);
        await refetch();
      } else if (result.status === "pending" || result.status === "in_process") {
        toast.info("Pagamento em processamento. O plano será liberado ao confirmar.");
      } else {
        throw new Error(`Pagamento recusado (${result.status ?? "desconhecido"})`);
      }
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPaying(false);
    }
  };

  const initialization = useMemo(
    () => ({
      amount: amountReais,
      payer: { email: email.trim() },
    }),
    [amountReais, email],
  );

  return (
    <Card
      id="planos-upgrade"
      className={cn("p-4 space-y-4", highlightUpgrade && "ring-2 ring-primary")}
    >
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h2 className="font-bold">Assinatura</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Plano atual: <strong>{PLANS[plano].name}</strong>
        {plano === "gratuito" && " · até 15 OS/mês · sem agenda/financeiro/estoque"}
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {(["solo", "oficina"] as const).map((id) => {
          const p = PLANS[id];
          const active = plano === id;
          return (
            <div
              key={id}
              className={cn(
                "rounded-xl border p-4 space-y-2",
                active ? "border-primary bg-accent/50" : "border-border",
              )}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <span className="font-display font-bold">
                  {p.priceLabel}
                  <span className="text-xs font-normal text-muted-foreground">/mês</span>
                </span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {id === "solo" ? (
                  <>
                    <li className="flex gap-1">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> OS ilimitadas
                    </li>
                    <li className="flex gap-1">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Agenda, financeiro,
                      estoque
                    </li>
                    <li className="flex gap-1">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Até 3 usuários
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-1">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Tudo do Pro
                    </li>
                    <li className="flex gap-1">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Usuários ilimitados
                    </li>
                    <li className="flex gap-1">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Suporte prioritário
                    </li>
                  </>
                )}
              </ul>
              <Button
                type="button"
                size="sm"
                className="w-full"
                variant={active ? "secondary" : "default"}
                disabled={active || (plano === "oficina" && id === "solo")}
                onClick={() => {
                  setError(null);
                  setSdkReady(false);
                  setTarget(id);
                }}
              >
                {active ? "Plano atual" : `Assinar ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Assinar {target ? PLANS[target].name : ""} —{" "}
              {target ? PLANS[target].priceLabel : ""}/mês
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>E-mail do pagamento</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                {error}
              </p>
            )}
            {paying && <p className="text-sm text-muted-foreground">Processando…</p>}
            {sdkReady && target && email.trim() && (
              <Payment
                initialization={initialization}
                customization={{
                  paymentMethods: {
                    creditCard: "all",
                    debitCard: "all",
                    ticket: "all",
                    bankTransfer: "all",
                    maxInstallments: 1,
                  },
                }}
                onSubmit={({ formData }) =>
                  new Promise<void>((resolve, reject) => {
                    void processRef
                      .current(formData as BrickFormData)
                      .then(() => resolve())
                      .catch((err) => reject(err));
                  })
                }
                onError={(err) => {
                  reportError(err, "PlanBilling.brick");
                  setError("Erro no formulário de pagamento. Tente de novo.");
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
