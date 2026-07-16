import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.24.2";
import { computeOrderAmountCents, FUNIL_PRICE_CENTS } from "../_shared/funilCatalog.ts";

const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");
const ALLOWED_ORIGINS = allowedOriginsEnv
  ? allowedOriginsEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-idempotency-key",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    Vary: "Origin",
  };
  if (!ALLOWED_ORIGINS) {
    headers["Access-Control-Allow-Origin"] = origin ?? "*";
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function isOriginAllowed(req: Request): boolean {
  if (!ALLOWED_ORIGINS) return true;
  const origin = req.headers.get("Origin");
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

const ProcessPaymentSchema = z.object({
  offerIds: z.array(z.string()).min(1),
  lead: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    whatsapp: z.string().min(8).max(30),
  }),
  formData: z.record(z.unknown()),
  meta: z.record(z.unknown()).optional(),
});

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase admin env missing");
  return createClient(url, key);
}

function mpToken() {
  const token = Deno.env.get("MP_ACCESS_TOKEN");
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado");
  return token;
}

/**
 * Valida webhook Mercado Pago (x-signature + x-request-id + data.id).
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
async function validateMpWebhookSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
  maxSkewMs?: number;
}): Promise<boolean> {
  const { xSignature, xRequestId, dataId, secret } = opts;
  if (!xSignature || !secret) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, ...rest] = p.trim().split("=");
      return [k, rest.join("=")];
    }),
  ) as { ts?: string; v1?: string };

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const maxSkew = opts.maxSkewMs ?? 5 * 60 * 1000;
  const skew = Math.abs(Date.now() - Number(ts));
  if (Number.isFinite(Number(ts)) && skew > maxSkew) return false;

  let manifest = "";
  if (dataId) manifest += `id:${dataId.toLowerCase()};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(manifest),
  );
  const hex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hex.length !== v1.length) return false;
  let mismatch = 0;
  for (let i = 0; i < hex.length; i++) {
    mismatch |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  return mismatch === 0;
}

async function createMpPayment(
  payload: Record<string, unknown>,
  idempotencyKey: string,
) {
  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const message =
      (data as { message?: string }).message ??
      JSON.stringify(data);
    throw new Error(`Mercado Pago: ${message}`);
  }
  return data as {
    id: number;
    status: string;
    status_detail: string;
    point_of_interaction?: unknown;
  };
}

async function fetchMpPayment(id: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${mpToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Falha ao consultar pagamento MP");
  return data as {
    id: number;
    status: string;
    status_detail: string;
    transaction_amount?: number;
    external_reference?: string;
    payer?: { email?: string };
  };
}

function buildPaymentBody(
  formData: Record<string, unknown>,
  amountReais: number,
  orderId: string,
  leadEmail: string,
) {
  const payerIn = (formData.payer ?? {}) as Record<string, unknown>;
  const identification = payerIn.identification as
    | { type?: string; number?: string }
    | undefined;

  const body: Record<string, unknown> = {
    transaction_amount: amountReais,
    description: "Playbook OficinaPRO",
    installments: Number(formData.installments ?? 1),
    payment_method_id: formData.payment_method_id,
    payer: {
      email: (payerIn.email as string) || leadEmail,
      ...(identification?.type && identification?.number
        ? {
            identification: {
              type: identification.type,
              number: identification.number,
            },
          }
        : {}),
    },
    external_reference: orderId,
    metadata: {
      order_id: orderId,
      source: "funil-quiz",
    },
  };

  if (formData.token) body.token = formData.token;
  if (formData.issuer_id != null && formData.issuer_id !== "") {
    body.issuer_id = formData.issuer_id;
  }

  return body;
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req);

  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(req)) {
      return new Response("Forbidden", { status: 403, headers: cors });
    }
    return new Response("ok", { headers: cors });
  }

  const url = new URL(req.url);

  // Webhook Mercado Pago (GET query ou POST)
  if (
    url.pathname.endsWith("/webhook") ||
    url.searchParams.get("topic") === "payment" ||
    url.searchParams.get("type") === "payment"
  ) {
    try {
      let bodyJson: { data?: { id?: string } } | null = null;
      if (req.method === "POST") {
        bodyJson = (await req.json().catch(() => null)) as {
          data?: { id?: string };
        } | null;
      }

      const paymentId =
        url.searchParams.get("data.id") ??
        url.searchParams.get("id") ??
        bodyJson?.data?.id ??
        null;

      const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET")?.trim();
      if (webhookSecret) {
        const ok = await validateMpWebhookSignature({
          xSignature: req.headers.get("x-signature"),
          xRequestId: req.headers.get("x-request-id"),
          dataId: paymentId,
          secret: webhookSecret,
        });
        if (!ok) {
          return json(req, { error: "Invalid signature" }, 401);
        }
      } else {
        console.warn(
          "MP_WEBHOOK_SECRET não configurado — webhook aceito sem validação",
        );
      }

      if (!paymentId) {
        return json(req, { ok: true, skipped: true });
      }

      const payment = await fetchMpPayment(String(paymentId));
      const admin = adminClient();
      const orderId = payment.external_reference;

      if (orderId) {
        await admin
          .from("funil_orders")
          .update({
            mp_payment_id: String(payment.id),
            mp_status: payment.status,
            mp_status_detail: payment.status_detail,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      } else {
        await admin
          .from("funil_orders")
          .update({
            mp_status: payment.status,
            mp_status_detail: payment.status_detail,
            updated_at: new Date().toISOString(),
          })
          .eq("mp_payment_id", String(payment.id));
      }

      return json(req, { ok: true });
    } catch (e) {
      console.error("webhook error", e);
      return json(req, { error: (e as Error).message }, 500);
    }
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  if (!isOriginAllowed(req)) {
    return json(req, { error: "Origin not allowed" }, 403);
  }

  try {
    const body = await req.json();
    const action = (body as { action?: string }).action ?? "processPayment";

    if (action === "getPublicKey") {
      const publicKey = Deno.env.get("MP_PUBLIC_KEY");
      if (!publicKey) {
        return json(req, { error: "MP_PUBLIC_KEY não configurada" }, 500);
      }
      return json(req, { publicKey });
    }

    if (action === "processPayment") {
      const parsed = ProcessPaymentSchema.safeParse(body);
      if (!parsed.success) {
        return json(
          req,
          { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
          400,
        );
      }

      const { offerIds, lead, formData, meta } = parsed.data;

      const ids = offerIds.includes("playbook")
        ? offerIds
        : ["playbook", ...offerIds];

      for (const id of ids) {
        if (!(id in FUNIL_PRICE_CENTS)) {
          return json(req, { error: `Oferta inválida: ${id}` }, 400);
        }
      }

      const amountCents = computeOrderAmountCents(ids);
      const amountReais = Math.round(amountCents) / 100;

      const clientAmount = Number(
        (formData as { transaction_amount?: number }).transaction_amount ?? 0,
      );
      if (Math.abs(clientAmount - amountReais) > 0.01) {
        return json(
          req,
          {
            error: "Valor inconsistente. Atualize a página e tente de novo.",
          },
          400,
        );
      }

      const admin = adminClient();
      const { data: order, error: orderErr } = await admin
        .from("funil_orders")
        .insert({
          email: lead.email.toLowerCase(),
          name: lead.name,
          whatsapp: lead.whatsapp,
          offer_ids: ids,
          amount_cents: amountCents,
          payer_email: lead.email.toLowerCase(),
          meta: meta ?? {},
          mp_status: "pending",
        })
        .select("id")
        .single();

      if (orderErr || !order) {
        console.error(orderErr);
        return json(req, { error: "Falha ao criar pedido" }, 500);
      }

      const idempotency =
        req.headers.get("x-idempotency-key") ?? crypto.randomUUID();

      const mpBody = buildPaymentBody(
        formData,
        amountReais,
        order.id,
        lead.email,
      );

      const payment = await createMpPayment(
        {
          ...mpBody,
          transaction_amount: amountReais,
        },
        idempotency,
      );

      await admin
        .from("funil_orders")
        .update({
          mp_payment_id: String(payment.id),
          mp_status: payment.status,
          mp_status_detail: payment.status_detail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      return json(req, {
        orderId: order.id,
        paymentId: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        pointOfInteraction: payment.point_of_interaction ?? null,
      });
    }

    if (action === "getPaymentStatus") {
      const paymentId = String((body as { paymentId?: string }).paymentId ?? "");
      const orderId = String((body as { orderId?: string }).orderId ?? "");
      const admin = adminClient();

      if (!paymentId && orderId) {
        const { data: order } = await admin
          .from("funil_orders")
          .select("id, mp_payment_id, mp_status")
          .eq("id", orderId)
          .maybeSingle();
        if (!order) return json(req, { error: "Pedido não encontrado" }, 404);
        if (order.mp_payment_id) {
          const payment = await fetchMpPayment(String(order.mp_payment_id));
          await admin
            .from("funil_orders")
            .update({
              mp_status: payment.status,
              mp_status_detail: payment.status_detail,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
          return json(req, {
            orderId: order.id,
            paymentId: payment.id,
            status: payment.status,
            statusDetail: payment.status_detail,
          });
        }
        return json(req, {
          orderId: order.id,
          status: order.mp_status ?? "pending",
        });
      }

      if (!paymentId) return json(req, { error: "paymentId obrigatório" }, 400);
      const payment = await fetchMpPayment(paymentId);
      const externalRef =
        typeof payment.external_reference === "string"
          ? payment.external_reference
          : orderId || undefined;
      if (externalRef) {
        await admin
          .from("funil_orders")
          .update({
            mp_payment_id: String(payment.id),
            mp_status: payment.status,
            mp_status_detail: payment.status_detail,
            updated_at: new Date().toISOString(),
          })
          .eq("id", externalRef);
      }
      return json(req, {
        orderId: externalRef,
        paymentId: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
      });
    }

    if (action === "verifyTrialOrder") {
      const orderId = String((body as { orderId?: string }).orderId ?? "");
      if (!orderId) return json(req, { error: "orderId obrigatório" }, 400);
      const admin = adminClient();
      const { data: order } = await admin
        .from("funil_orders")
        .select("id, mp_status, mp_payment_id")
        .eq("id", orderId)
        .maybeSingle();
      if (!order) {
        return json(req, { ok: false, approved: false, error: "not_found" });
      }

      let status = order.mp_status as string | null;
      if (order.mp_payment_id) {
        try {
          const payment = await fetchMpPayment(String(order.mp_payment_id));
          status = payment.status;
          await admin
            .from("funil_orders")
            .update({
              mp_status: payment.status,
              mp_status_detail: payment.status_detail,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        } catch {
          /* usa status em banco */
        }
      }

      const approved = status === "approved" || status === "authorized";
      return json(req, { ok: true, approved, orderId: order.id, status });
    }

    return json(req, { error: "Ação desconhecida" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: (e as Error).message }, 500);
  }
});
