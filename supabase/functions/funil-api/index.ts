import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.24.2";

const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");
const ALLOWED_ORIGINS = allowedOriginsEnv
  ? allowedOriginsEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

const LOVABLE_HOST_RE = /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovable\.dev|lovableproject\.com)$/i;
const CUSTOM_ALLOWED_ORIGINS = new Set([
  "https://oficinapro.life",
  "https://www.oficinapro.life",
]);

function isBuiltInAllowedOrigin(origin: string): boolean {
  return CUSTOM_ALLOWED_ORIGINS.has(origin) || LOVABLE_HOST_RE.test(origin);
}

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    Vary: "Origin",
  };
  if (origin && isBuiltInAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (!ALLOWED_ORIGINS) {
    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    } else if (!origin) {
      headers["Access-Control-Allow-Origin"] = "*";
    }
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get("Origin");
  if (!origin) return true;
  if (isBuiltInAllowedOrigin(origin)) return true;
  if (ALLOWED_ORIGINS?.includes(origin)) return true;
  if (!ALLOWED_ORIGINS) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  return false;
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase admin env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

const UpsertLeadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  whatsapp: z.string().trim().min(8).max(30),
  email: z.union([z.string().email().max(255), z.literal(""), z.null()]).optional(),
  meta: z.record(z.unknown()).optional(),
  lastStep: z.string().trim().max(64).optional(),
  createdAt: z.string().datetime().optional(),
});

const TouchLeadSchema = z.object({
  whatsapp: z.string().trim().min(8).max(30),
  lastStep: z.string().trim().min(1).max(64),
  meta: z.record(z.unknown()).optional(),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(req)) {
      return new Response("Forbidden", { status: 403, headers: corsHeadersFor(req) });
    }
    return new Response("ok", { headers: corsHeadersFor(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  if (!isOriginAllowed(req)) {
    return json(req, { error: "Origin not allowed" }, 403);
  }

  try {
    const body = await req.json();
    const action = (body as { action?: string }).action;

    if (action === "upsertLead") {
      const parsed = UpsertLeadSchema.safeParse(body);
      if (!parsed.success) {
        return json(req, { error: parsed.error.issues[0]?.message ?? "Payload inválido" }, 400);
      }
      const lead = parsed.data;
      const admin = adminClient();
      const { error } = await admin.from("funil_leads").upsert(
        {
          name: lead.name,
          whatsapp: lead.whatsapp.replace(/\D/g, ""),
          email: lead.email || null,
          meta: lead.meta ?? {},
          last_step: lead.lastStep ?? "checkout",
          updated_at: new Date().toISOString(),
          created_at: lead.createdAt ?? new Date().toISOString(),
        },
        { onConflict: "whatsapp" },
      );
      if (error) {
        console.error("upsertLead", error);
        return json(req, { ok: false, error: "Falha ao salvar lead" }, 500);
      }
      return json(req, { ok: true });
    }

    if (action === "touchLeadStep") {
      const parsed = TouchLeadSchema.safeParse(body);
      if (!parsed.success) {
        return json(req, { error: parsed.error.issues[0]?.message ?? "Payload inválido" }, 400);
      }
      const { whatsapp, lastStep, meta } = parsed.data;
      const admin = adminClient();
      const patch: Record<string, unknown> = {
        last_step: lastStep,
        updated_at: new Date().toISOString(),
      };
      if (meta) patch.meta = meta;
      const { error } = await admin
        .from("funil_leads")
        .update(patch)
        .eq("whatsapp", whatsapp.replace(/\D/g, ""));
      if (error) {
        console.error("touchLeadStep", error);
        return json(req, { ok: false, error: "Falha ao atualizar lead" }, 500);
      }
      return json(req, { ok: true });
    }

    return json(req, { error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json(req, { error: (e as Error).message }, 500);
  }
});
