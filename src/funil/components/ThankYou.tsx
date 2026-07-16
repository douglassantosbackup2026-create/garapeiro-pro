import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Gift, PartyPopper } from "lucide-react";
import { getOfferById, saasTrialBonus } from "@/funil/data/offers";
import { useFunnel } from "@/funil/funnel/FunnelContext";
import { BrandHeader, Shell } from "./BrandHeader";
import { buildCadastroUrl } from "@/funil/lib/utils";
import { buildWhatsappRecoveryLink } from "@/funil/lib/storage";
import { supabase } from "@/integrations/supabase/client";

type StoredPayment = {
  paymentId?: number;
  orderId?: string;
  status?: string;
};

const PAYMENT_STORAGE_KEY = "oficinapro-mp-payment";

function readStoredPayment(): StoredPayment | null {
  try {
    const raw = sessionStorage.getItem(PAYMENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPayment;
  } catch {
    return null;
  }
}

function writeStoredPayment(payload: StoredPayment) {
  try {
    sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function isApproved(status?: string) {
  return status === "approved" || status === "authorized";
}

export function ThankYou() {
  const { selectedOfferIds, diagnosis, state, dispatch } = useFunnel();
  const initial = useMemo(() => readStoredPayment(), []);
  const [payment, setPayment] = useState<StoredPayment | null>(initial);
  const [checking, setChecking] = useState(
    () => Boolean(initial?.paymentId) && !isApproved(initial?.status),
  );

  const approved = isApproved(payment?.status);

  useEffect(() => {
    const paymentId = payment?.paymentId;
    if (!paymentId || approved) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    async function refresh() {
      const { data, error } = await supabase.functions.invoke("mercado-pago", {
        body: {
          action: "getPaymentStatus",
          paymentId: String(paymentId),
          orderId: payment?.orderId,
        },
      });
      if (cancelled || error) return;
      const result = data as {
        status?: string;
        orderId?: string;
        paymentId?: number;
        error?: string;
      };
      if (result.error || !result.status) return;
      const next: StoredPayment = {
        paymentId: result.paymentId ?? paymentId,
        orderId: result.orderId ?? payment?.orderId,
        status: result.status,
      };
      writeStoredPayment(next);
      setPayment(next);
      if (isApproved(result.status)) setChecking(false);
    }

    void refresh();
    const id = window.setInterval(() => void refresh(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [payment?.paymentId, payment?.orderId, approved]);

  const cadastroUrl = buildCadastroUrl({
    content: diagnosis.profile.id,
    campaign: "playbook-trial-14d",
    trialDays: saasTrialBonus.days,
    orderId: payment?.orderId,
  });

  const recoveryWa =
    state.lead && !approved
      ? buildWhatsappRecoveryLink(
          state.lead,
          `Oi! Meu pagamento do Método OficinaPRO ainda não liberou${payment?.orderId ? ` (pedido ${payment.orderId.slice(0, 8)}…)` : ""}. Pode ajudar?`,
        )
      : null;

  return (
    <Shell>
      <BrandHeader className="mb-6" />

      <section className="animate-pop space-y-6">
        <div className="rounded-2xl border border-money/30 bg-money/10 p-5">
          <div className="mb-2 flex items-center gap-2 text-money">
            <PartyPopper className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {approved
                ? "Tudo certo"
                : checking
                  ? "Confirmando pagamento…"
                  : "Aguardando confirmação"}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {approved
              ? state.lead?.name
                ? `${state.lead.name.split(" ")[0]}, seus materiais estão prontos`
                : "Seus materiais estão prontos"
              : "Pagamento ainda não confirmado"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {approved ? (
              <>
                Baixe os PDFs selecionados. Sua compra do Método inclui{" "}
                <strong className="font-semibold text-foreground">
                  {saasTrialBonus.days} dias grátis do OficinaPRO
                </strong>{" "}
                — ative o trial e coloque as estratégias em prática.
              </>
            ) : (
              <>
                Assim que o Mercado Pago confirmar o pagamento, os downloads
                ficam disponíveis nesta tela. Se você atualizou a página, estamos
                consultando o status do pedido automaticamente.
              </>
            )}
          </p>
        </div>

        {approved && (
          <div>
            <h2 className="font-display mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Downloads
            </h2>
            <ul className="space-y-2">
              {selectedOfferIds.map((id) => {
                const offer = getOfferById(id);
                if (!offer) return null;
                return (
                  <li key={id}>
                    <a
                      href={offer.pdfPath}
                      download={offer.pdfFileName}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:border-primary/40 hover:bg-muted/50"
                    >
                      <span>{offer.title}</span>
                      <Download className="size-4 shrink-0 text-primary" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {approved && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-money/15 text-money">
                <Gift className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold">{saasTrialBonus.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {saasTrialBonus.description}
                </p>
              </div>
            </div>
            <a
              href={cadastroUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-4 text-base font-semibold text-background shadow-md transition hover:opacity-90"
            >
              {saasTrialBonus.ctaLabel}
              <ExternalLink className="size-4" />
            </a>
          </div>
        )}

        {recoveryWa && (
          <a
            href={recoveryWa}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-semibold text-foreground transition hover:bg-muted/50"
          >
            Precisa de ajuda? Falar no WhatsApp
          </a>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: "RESET" })}
          className="w-full text-center text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          Refazer diagnóstico
        </button>
      </section>
    </Shell>
  );
}
