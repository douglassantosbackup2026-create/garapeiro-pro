// Meta Conversions API — envia eventos server-side complementando o Pixel do browser.
// Deduplica pelo event_id compartilhado com fbq('track', ..., {eventID}).

const PIXEL_ID = "4269485799969770";
const GRAPH_VERSION = "v20.0";

const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");
const ALLOWED_ORIGINS = allowedOriginsEnv
  ? allowedOriginsEnv.split(",").map((s) => s.trim()).filter(Boolean)
  : null;
const LOVABLE_HOST_RE = /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovable\.dev|lovableproject\.com)$/i;
const CUSTOM_ALLOWED = new Set(["https://oficinapro.life", "https://www.oficinapro.life"]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return !ALLOWED_ORIGINS;
  if (CUSTOM_ALLOWED.has(origin) || LOVABLE_HOST_RE.test(origin)) return true;
  if (ALLOWED_ORIGINS?.includes(origin)) return true;
  if (!ALLOWED_ORIGINS) return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return false;
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const h: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origin && isAllowedOrigin(origin)) h["Access-Control-Allow-Origin"] = origin;
  else if (!origin) h["Access-Control-Allow-Origin"] = "*";
  return h;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}
function normalizeName(v: string) {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function normalizePhone(v: string) {
  const d = v.replace(/\D/g, "");
  // Se veio sem DDI (BR 11 dígitos ou menos com DDD), força 55
  if (d.length <= 11) return `55${d}`;
  return d;
}

type Payload = {
  event_name: "Lead" | "InitiateCheckout" | "Purchase" | "ViewContent" | "CompleteRegistration";
  event_id: string;
  event_source_url?: string;
  event_time?: number;
  user_data?: {
    email?: string | null;
    phone?: string | null;
    external_id?: string | null;
    fbc?: string | null;
    fbp?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
  custom_data?: Record<string, unknown>;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
  if (!isAllowedOrigin(req.headers.get("Origin"))) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const token = Deno.env.get("META_CAPI_ACCESS_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "CAPI token not configured" }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  if (!body?.event_name || !body?.event_id) {
    return new Response(JSON.stringify({ error: "event_name and event_id required" }), {
      status: 400,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const fwd = req.headers.get("x-forwarded-for");
  const clientIp = fwd ? fwd.split(",")[0]!.trim() : req.headers.get("cf-connecting-ip") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const user_data: Record<string, string | string[]> = {};
  if (body.user_data?.email) user_data.em = await sha256Hex(normalizeEmail(body.user_data.email));
  if (body.user_data?.phone) user_data.ph = await sha256Hex(normalizePhone(body.user_data.phone));
  if (body.user_data?.external_id)
    user_data.external_id = await sha256Hex(body.user_data.external_id.trim().toLowerCase());
  if (body.user_data?.fbc) user_data.fbc = body.user_data.fbc;
  if (body.user_data?.fbp) user_data.fbp = body.user_data.fbp;
  if (clientIp) user_data.client_ip_address = clientIp;
  if (userAgent) user_data.client_user_agent = userAgent;

  const eventPayload = {
    data: [
      {
        event_name: body.event_name,
        event_time: body.event_time ?? Math.floor(Date.now() / 1000),
        event_id: body.event_id,
        action_source: "website",
        event_source_url: body.event_source_url,
        user_data,
        custom_data: body.custom_data ?? {},
      },
    ],
  };

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload),
  });
  const respText = await resp.text();

  if (!resp.ok) {
    console.error("meta-capi error", resp.status, respText);
    return new Response(
      JSON.stringify({ ok: false, status: resp.status, meta: respText }),
      { status: 502, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true, meta: JSON.parse(respText) }), {
    status: 200,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
});