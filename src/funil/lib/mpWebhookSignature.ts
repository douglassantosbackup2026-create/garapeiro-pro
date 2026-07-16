/**
 * Validação de assinatura webhook Mercado Pago (Web Crypto).
 * Espelha a lógica em supabase/functions/mercado-pago/index.ts
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export async function validateMpWebhookSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
  maxSkewMs?: number;
  /** Para testes: fixar "agora" em ms */
  nowMs?: number;
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
  const now = opts.nowMs ?? Date.now();
  const skew = Math.abs(now - Number(ts));
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

export async function signMpWebhookForTest(opts: {
  dataId: string;
  requestId: string;
  ts: string;
  secret: string;
}): Promise<string> {
  const manifest = `id:${opts.dataId.toLowerCase()};request-id:${opts.requestId};ts:${opts.ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(opts.secret),
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
  return `ts=${opts.ts},v1=${hex}`;
}
