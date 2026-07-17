import { useEffect, useMemo, useRef, useState } from "react";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import {
  formatTotalCents,
  getOfferById,
  mainOffer,
  orderBumps,
  saasTrialBonus,
} from "@/funil/data/offers";
import { useFunnel } from "@/funil/funnel/FunnelContext";
import { trackMetaEvent } from "@/funil/lib/metaPixel";
import { buildWhatsappRecoveryLink, touchLeadStep } from "@/funil/lib/storage";
import { reportError } from "@/lib/reportError";
import { BrandHeader, Shell } from "./BrandHeader";
import { supabase } from "@/integrations/supabase/client";

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

type PendingPayment = {
  paymentId: number;
  orderId?: string;
  status: string;
};

const PAYMENT_STORAGE_KEY = "oficinapro-mp-payment";

let mpInitKey: string | null = null;

async function ensureMpInit(publicKey: string) {
  if (mpInitKey === publicKey) return;
  await initMercadoPago(publicKey, { locale: "pt-BR" });
  mpInitKey = publicKey;
}

/** Access Token costuma ser bem mais longo e com vários segmentos numerados. */
function looksLikeAccessToken(key: string): boolean {
  if (key.length > 80) return true;
  return /^APP_USR-\d{10,}-\d{6}-[a-f0-9]{32}-\d+$/i.test(key);
}

function storePayment(payload: {
  paymentId?: number;
  orderId?: string;
  status: string;
}) {
  try {
    sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function trackPurchase(valueReais: number, orderId?: string) {
  trackMetaEvent("Purchase", {
    currency: "BRL",
    value: valueReais,
    content_name: "playbook-oficinapro",
    ...(orderId ? { order_id: orderId } : {}),
  });
}

function brickErrorMessage(err: unknown): string {
  const raw =
    err && typeof err === "object"
      ? String(
          (err as { message?: string; cause?: string }).message ??
            (err as { cause?: string }).cause ??
            "",
        )
      : String(err ?? "");
  const lower = raw.toLowerCase();
  if (lower.includes("already_initialized")) {
    return "O formulário de pagamento travou ao recarregar. Toque em Tentar de novo.";
  }
  if (
    lower.includes("failed to load mercadopago") ||
    lower.includes("content security policy") ||
    lower.includes("csp")
  ) {
    return "O navegador bloqueou o SDK do Mercado Pago (CSP). Recarregue após atualizar a política de segurança ou use outro navegador.";
  }
  if (
    lower.includes("public_key") ||
    lower.includes("get_payment_methods") ||
    lower.includes("invalid")
  ) {
    return "Chave pública do Mercado Pago inválida. Confira VITE_MP_PUBLIC_KEY (Public Key, não Access Token).";
  }
  return raw || "Não foi possível carregar o formulário de pagamento.";
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function maskWhatsapp(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function MercadoPagoCheckout() {
  const { state, selectedOfferIds, persistAndComplete, submitLead } =
    useFunnel();
  const [sdkReady, setSdkReady] = useState(false);
  const [mountBrick, setMountBrick] = useState(false);
  const [brickKey, setBrickKey] = useState(0);
  const [brickLoading, setBrickLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(
    null,
  );
  const [nameDraft, setNameDraft] = useState(state.lead?.name ?? "");
  const [whatsappDraft, setWhatsappDraft] = useState(
    state.lead?.whatsapp
      ? maskWhatsapp(state.lead.whatsapp)
      : "",
  );
  const [emailDraft, setEmailDraft] = useState(state.lead?.email ?? "");
  const [leadBusy, setLeadBusy] = useState(false);
  const completingRef = useRef(false);
  const persistRef = useRef(persistAndComplete);
  persistRef.current = persistAndComplete;
  const processPaymentRef = useRef<(formData: BrickFormData) => Promise<void>>(
    async () => undefined,
  );

  const onBrickSubmit = useRef(
    ({ formData }: { formData: BrickFormData }) =>
      new Promise<void>((resolve, reject) => {
        void processPaymentRef
          .current(formData)
          .then(() => resolve())
          .catch((err) => reject(err));
      }),
  ).current;

  const onBrickReady = useRef(() => {
    setBrickLoading(false);
  }).current;

  const onBrickError = useRef((err: unknown) => {
    reportError(err, "MercadoPago.brick");
    setBrickLoading(false);
    setError(brickErrorMessage(err));
  }).current;

  const needsLead = !state.lead;
  const needsEmail = Boolean(state.lead && !state.lead.email.trim());
  const showPayment =
    !pendingPayment && !needsLead && !needsEmail && sdkReady && Boolean(state.lead);

  // Recovery: mark abandonment if user leaves checkout mid-flow
  useEffect(() => {
    if (!state.lead?.whatsapp || pendingPayment) return;
    const markAbandoned = () => {
      void touchLeadStep(state.lead!.whatsapp, "checkout_abandoned", {
        recoveryHint: "whatsapp",
        profileId: state.lead?.name,
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") markAbandoned();
    };
    window.addEventListener("pagehide", markAbandoned);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", markAbandoned);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state.lead, pendingPayment]);

  const totalCents = useMemo(() => {
    return (
      mainOffer.priceCents +
      orderBumps
        .filter((b) => state.selectedBumps.includes(b.id))
        .reduce((sum, b) => sum + b.priceCents, 0)
    );
  }, [state.selectedBumps]);

  const amountReais = Number((totalCents / 100).toFixed(2));
  const envPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY?.trim() ?? "";
  const leadEmail = state.lead?.email?.trim() ?? "";

  const paymentInitialization = useMemo(
    () => ({
      amount: amountReais,
      payer: { email: leadEmail },
    }),
    [amountReais, leadEmail],
  );

  const paymentCustomization = useMemo(
    () => ({
      paymentMethods: {
        creditCard: "all" as const,
        debitCard: "all" as const,
        bankTransfer: "all" as const,
        maxInstallments: 12,
      },
    }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function resolvePublicKey() {
      if (envPublicKey) return envPublicKey;

      const { data, error: fnError } = await supabase.functions.invoke(
        "mercado-pago",
        { body: { action: "getPublicKey" } },
      );
      if (fnError) throw fnError;
      const key = (data as { publicKey?: string; error?: string })?.publicKey?.trim();
      if (!key) {
        throw new Error(
          (data as { error?: string })?.error ??
            "MP_PUBLIC_KEY não configurada no servidor",
        );
      }
      return key;
    }

    void (async () => {
      try {
        const publicKey = await resolvePublicKey();
        if (cancelled) return;
        if (looksLikeAccessToken(publicKey)) {
          setSdkReady(false);
          setBrickLoading(false);
          setError(
            "Use a Public Key no VITE_MP_PUBLIC_KEY, não o Access Token.",
          );
          return;
        }
        await ensureMpInit(publicKey);
        if (cancelled) return;
        setError(null);
        setSdkReady(true);
      } catch (e) {
        if (cancelled) return;
        setSdkReady(false);
        setBrickLoading(false);
        setError(
          brickErrorMessage(
            e instanceof Error
              ? e
              : "Checkout indisponível: falha ao carregar o Mercado Pago.",
          ),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [envPublicKey]);

  // Bloqueia navegação same-origin do form do Brick (reload da página).
  // Só preventDefault — stopPropagation quebraria o handler interno do Pix.
  useEffect(() => {
    function isLocalFormAction(action: string | null): boolean {
      if (!action || action === "#" || action.trim() === "") return true;
      if (action.startsWith("/") || action.startsWith("?")) return true;
      try {
        const url = new URL(action, window.location.href);
        return url.origin === window.location.origin;
      } catch {
        return true;
      }
    }

    function onSubmitCapture(e: Event) {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.closest("#paymentBrick_container")) return;
      if (!isLocalFormAction(form.getAttribute("action"))) return;
      e.preventDefault();
    }

    document.addEventListener("submit", onSubmitCapture, true);
    return () => document.removeEventListener("submit", onSubmitCapture, true);
  }, []);

  const brickMountId = showPayment
    ? `${brickKey}|${amountReais}|${leadEmail}`
    : null;

  // Atrasa o mount do Brick (evita already_initialized no Strict Mode).
  // Remonta só quando brickKey / valor / e-mail mudam — não a cada re-render.
  useEffect(() => {
    if (!brickMountId) {
      setMountBrick(false);
      return;
    }

    let cancelled = false;
    setBrickLoading(true);
    setMountBrick(false);
    const id = window.setTimeout(() => {
      if (!cancelled) setMountBrick(true);
    }, 50);
    const failSafe = window.setTimeout(() => {
      if (cancelled) return;
      setBrickLoading((loading) => {
        if (loading) {
          setError(
            "O formulário de pagamento não carregou a tempo. Verifique a conexão ou toque em Tentar de novo.",
          );
          return false;
        }
        return loading;
      });
    }, 15000);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
      window.clearTimeout(failSafe);
    };
  }, [brickMountId]);

  useEffect(() => {
    if (!pendingPayment) return;
    const paymentId = pendingPayment.paymentId;
    const orderId = pendingPayment.orderId;

    let cancelled = false;

    async function completeIfApproved(status: string) {
      if (cancelled || completingRef.current) return;
      if (status !== "approved" && status !== "authorized") return;
      completingRef.current = true;
      storePayment({ paymentId, orderId, status });
      trackPurchase(amountReais, orderId);
      await persistRef.current();
    }

    async function poll() {
      const { data, error: fnError } = await supabase.functions.invoke(
        "mercado-pago",
        {
          body: {
            action: "getPaymentStatus",
            paymentId: String(paymentId),
          },
        },
      );
      if (cancelled || fnError) return;
      const result = data as { status?: string; error?: string };
      if (result.error || !result.status) return;
      setPendingPayment((prev) => {
        if (!prev || prev.status === result.status) return prev;
        return { ...prev, status: result.status! };
      });
      await completeIfApproved(result.status);
    }

    void poll();
    const id = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pendingPayment?.paymentId, amountReais]);

  async function processPayment(formData: BrickFormData): Promise<void> {
    if (!state.lead) {
      setError("Lead não encontrado. Volte e preencha seus dados.");
      throw new Error("missing lead");
    }
    const email = (state.lead.email || formData.payer?.email || "").trim();
    if (!email) {
      setError("Informe um e-mail para o comprovante.");
      throw new Error("missing email");
    }

    setPaying(true);
    setError(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const { data, error: fnError } = await supabase.functions.invoke(
        "mercado-pago",
        {
          body: {
            action: "processPayment",
            offerIds: selectedOfferIds,
            lead: { ...state.lead, email },
            formData: {
              ...formData,
              payer: { ...formData.payer, email },
            },
            meta: { profileHint: "funil-quiz" },
          },
          headers: { "x-idempotency-key": idempotencyKey },
        },
      );

      if (fnError) {
        setError(fnError.message);
        throw fnError;
      }

      const result = data as {
        error?: string;
        status?: string;
        statusDetail?: string;
        paymentId?: number;
        orderId?: string;
      };

      if (result.error) {
        setError(result.error);
        throw new Error(result.error);
      }

      const ok =
        result.status === "approved" ||
        result.status === "authorized" ||
        result.status === "pending" ||
        result.status === "in_process";

      if (!ok || result.paymentId == null) {
        setError(
          `Pagamento não concluído (${result.status ?? "?"}: ${result.statusDetail ?? ""})`,
        );
        throw new Error(result.statusDetail ?? "payment_failed");
      }

      storePayment({
        paymentId: result.paymentId,
        orderId: result.orderId,
        status: result.status!,
      });

      if (result.status === "approved" || result.status === "authorized") {
        trackPurchase(amountReais, result.orderId);
        await persistAndComplete();
      } else {
        const pending: PendingPayment = {
          paymentId: result.paymentId,
          orderId: result.orderId,
          status: result.status!,
        };
        // Depois do resolve() do Brick — StatusScreen com QR Pix
        window.setTimeout(() => setPendingPayment(pending), 0);
      }
    } finally {
      setPaying(false);
    }
  }
  processPaymentRef.current = processPayment;

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    const name = nameDraft.trim();
    const digits = onlyDigits(whatsappDraft);
    const email = emailDraft.trim().toLowerCase();

    if (name.length < 2) {
      setError("Informe seu nome.");
      return;
    }
    if (digits.length < 10) {
      setError("WhatsApp inválido.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("E-mail inválido.");
      return;
    }

    setError(null);
    setLeadBusy(true);
    try {
      await submitLead({
        name,
        whatsapp: digits,
        email,
        createdAt: state.lead?.createdAt ?? new Date().toISOString(),
      });
    } finally {
      setLeadBusy(false);
    }
  }

  async function confirmEmail(e: React.FormEvent) {
    e.preventDefault();
    const email = emailDraft.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("E-mail inválido.");
      return;
    }
    if (!state.lead) {
      setError("Preencha seus dados de contato.");
      return;
    }
    setError(null);
    setLeadBusy(true);
    try {
      await submitLead({
        ...state.lead,
        email,
      });
    } finally {
      setLeadBusy(false);
    }
  }

  function retryBrick() {
    setError(null);
    setBrickLoading(true);
    setBrickKey((k) => k + 1);
  }

  return (
    <Shell>
      <BrandHeader className="mb-6" />

      <section className="animate-pop space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {pendingPayment ? "Finalize o pagamento" : "Pagamento seguro"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {pendingPayment
              ? "Escaneie o Pix ou acompanhe o status abaixo. Os materiais liberam assim que o Mercado Pago confirmar."
              : "Checkout transparente Mercado Pago — cartão, Pix e outros métodos, sem sair do OficinaPRO."}
          </p>
        </div>

        {!pendingPayment && state.lead && (
          <div className="rounded-xl border border-money/30 bg-money/10 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              Olá, {state.lead.name.split(" ")[0]} — sua oferta ainda está aqui
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete o pagamento para liberar o Método.
            </p>
          </div>
        )}

        {!pendingPayment && (
          <>
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {selectedOfferIds.map((id) => {
                const offer = getOfferById(id);
                if (!offer) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{offer.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {offer.subtitle}
                      </p>
                    </div>
                    <span className="text-sm font-bold">{offer.priceLabel}</span>
                  </li>
                );
              })}
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-money">
                    {saasTrialBonus.shortLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Incluso na compra do Método
                  </p>
                </div>
                <span className="text-sm font-bold text-money">
                  {saasTrialBonus.priceLabel}
                </span>
              </li>
            </ul>

            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-sm font-medium">Total</span>
              <span className="font-display text-lg font-bold">
                {formatTotalCents(totalCents)}
              </span>
            </div>
          </>
        )}

        {error && (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>
            {showPayment && (
              <button
                type="button"
                onClick={retryBrick}
                className="font-semibold underline underline-offset-2"
              >
                Tentar de novo
              </button>
            )}
          </div>
        )}

        {paying && (
          <p className="text-center text-sm text-muted-foreground">
            Processando pagamento…
          </p>
        )}

        {needsLead && !pendingPayment && (
          <form
            onSubmit={submitContact}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">
                Seus dados para o pagamento
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Usamos nome, WhatsApp e e-mail para o comprovante e liberar o
                acesso.
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold">Nome</span>
              <input
                required
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold">WhatsApp</span>
              <input
                required
                value={whatsappDraft}
                onChange={(e) => setWhatsappDraft(maskWhatsapp(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold">E-mail</span>
              <input
                type="email"
                required
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
                placeholder="voce@email.com"
                autoComplete="email"
              />
            </label>
            <button
              type="submit"
              disabled={leadBusy}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Continuar para o pagamento
            </button>
          </form>
        )}

        {needsEmail && !needsLead && !pendingPayment && (
          <form
            onSubmit={confirmEmail}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <p className="text-sm text-muted-foreground">
              Falta só o e-mail para o comprovante e o Pix/cartão.
            </p>
            <input
              type="email"
              required
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-primary focus:ring-2"
              placeholder="voce@email.com"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={leadBusy}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Continuar para o pagamento
            </button>
          </form>
        )}

        {pendingPayment && sdkReady && (
          <div
            id="statusScreenBrick_container"
            className="min-h-[360px] rounded-xl border border-border bg-card p-2"
          >
            <StatusScreen
              key={`status-${pendingPayment.paymentId}`}
              initialization={{
                paymentId: String(pendingPayment.paymentId),
              }}
              customization={{
                visual: { showExternalReference: true },
              }}
              onError={(err) => {
                reportError(err, "MercadoPago.statusScreen");
                setError("Não foi possível carregar o status do pagamento.");
              }}
            />
          </div>
        )}

        {showPayment && (
          <div
            id="paymentBrick_container"
            className="relative min-h-[320px] rounded-xl border border-border bg-card p-2"
          >
            {brickLoading && (
              <p className="absolute inset-x-0 top-6 text-center text-sm text-muted-foreground">
                Carregando pagamento seguro…
              </p>
            )}
            {mountBrick && state.lead && (
              <Payment
                key={`payment-brick-${brickKey}-${amountReais}-${leadEmail}`}
                initialization={paymentInitialization}
                customization={paymentCustomization}
                onSubmit={onBrickSubmit}
                onError={onBrickError}
                onReady={onBrickReady}
              />
            )}
          </div>
        )}
      </section>
    </Shell>
  );
}
