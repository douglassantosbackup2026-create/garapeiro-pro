import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.24.2";
import type { Database } from "../_shared/database.types.ts";

type Admin = SupabaseClient<Database>;
type AppRole = Database["public"]["Enums"]["app_role"];

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Matches DB default: encode(gen_random_bytes(24), 'hex') */
const inviteTokenRegex = /^[0-9a-f]{48}$/i;

const CreateWorkshopSchema = z.object({
  nome: z.string().min(1, "Nome da oficina obrigatório").max(255),
  telefone: z.string().max(30).optional().nullable(),
  endereco: z.string().max(500).optional().nullable(),
  profileNome: z.string().max(255).optional().nullable(),
});

const CreateInviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["dono", "mecanico"]).optional(),
});

const AcceptInviteSchema = z.object({
  token: z.string().regex(inviteTokenRegex, "Token inválido"),
});

const RemoveMemberSchema = z.object({
  userId: z.string().regex(uuidRegex, "userId inválido"),
});

const RevokeInviteSchema = z.object({
  inviteId: z.string().regex(uuidRegex, "inviteId inválido"),
});

const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");
const ALLOWED_ORIGINS = allowedOriginsEnv
  ? allowedOriginsEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null; // null = allow any origin until ALLOWED_ORIGINS is configured

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req);

  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(req)) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!isOriginAllowed(req)) {
      return respond(req, { error: "Origin not allowed" }, 403);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return respond(req, { error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const admin = createClient<Database>(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const {
      data: { user },
      error: authErr,
    } = await admin.auth.getUser(token);
    if (authErr || !user) return respond(req, { error: "Unauthorized" }, 401);

    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case "createWorkshop": {
        const p = CreateWorkshopSchema.safeParse(data);
        if (!p.success) return respond(req, { error: p.error.issues[0].message }, 400);
        return respond(req, await createWorkshop(user.id, p.data, admin));
      }
      case "createInvite": {
        const p = CreateInviteSchema.safeParse(data);
        if (!p.success) return respond(req, { error: p.error.issues[0].message }, 400);
        return respond(req, await createInvite(user.id, p.data, admin));
      }
      case "acceptInvite": {
        const p = AcceptInviteSchema.safeParse(data);
        if (!p.success) return respond(req, { error: p.error.issues[0].message }, 400);
        return respond(req, await acceptInvite(user.id, user.email ?? "", p.data, admin));
      }
      case "listMembers":
        return respond(req, await listMembers(user.id, admin));
      case "removeMember": {
        const p = RemoveMemberSchema.safeParse(data);
        if (!p.success) return respond(req, { error: p.error.issues[0].message }, 400);
        return respond(req, await removeMember(user.id, p.data, admin));
      }
      case "revokeInvite": {
        const p = RevokeInviteSchema.safeParse(data);
        if (!p.success) return respond(req, { error: p.error.issues[0].message }, 400);
        return respond(req, await revokeInvite(user.id, p.data, admin));
      }
      default:
        return respond(req, { error: "Unknown action" }, 400);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return respond(req, { error: msg }, 400);
  }
});

function respond(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

async function createWorkshop(
  userId: string,
  data: {
    nome: string;
    telefone?: string | null;
    endereco?: string | null;
    profileNome?: string | null;
  },
  admin: Admin,
) {
  const { data: prof } = await admin
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .maybeSingle();
  if (prof?.workshop_id) throw new Error("Você já pertence a uma oficina.");

  const { data: ws, error: wsErr } = await admin
    .from("workshops")
    .insert({
      nome: data.nome,
      telefone: data.telefone ?? null,
      endereco: data.endereco ?? null,
      created_by: userId,
    })
    .select("id")
    .single();
  if (wsErr || !ws) throw new Error(wsErr?.message || "Falha ao criar oficina");

  await admin
    .from("profiles")
    .upsert(
      { id: userId, workshop_id: ws.id, ...(data.profileNome ? { nome: data.profileNome } : {}) },
      { onConflict: "id" },
    );
  await admin.from("user_roles").insert({ user_id: userId, workshop_id: ws.id, role: "dono" });
  return { workshopId: ws.id };
}

async function createInvite(userId: string, data: { email: string; role?: AppRole }, admin: Admin) {
  const { data: prof } = await admin
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .single();
  const wsId = prof?.workshop_id;
  if (!wsId) throw new Error("Sem oficina");

  const { data: role } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("workshop_id", wsId)
    .eq("role", "dono")
    .maybeSingle();
  if (!role) throw new Error("Apenas donos podem convidar");

  const { data: inv, error } = await admin
    .from("workshop_invites")
    .insert({
      workshop_id: wsId,
      email: data.email.toLowerCase(),
      role: data.role ?? "mecanico",
      invited_by: userId,
    })
    .select("id, token, email, role, expires_at")
    .single();
  if (error || !inv) throw new Error(error?.message || "Falha ao criar convite");
  return inv;
}

async function acceptInvite(
  userId: string,
  userEmail: string,
  data: { token: string },
  admin: Admin,
) {
  const { data: inv, error } = await admin
    .from("workshop_invites")
    .select("id, workshop_id, email, role, expires_at, used_at")
    .eq("token", data.token)
    .maybeSingle();
  if (error || !inv) throw new Error("Convite inválido");
  if (inv.used_at) throw new Error("Convite já utilizado");
  if (new Date(inv.expires_at) < new Date()) throw new Error("Convite expirado");
  if (userEmail && inv.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error(`Este convite é para ${inv.email}`);
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .maybeSingle();
  if (prof?.workshop_id) throw new Error("Você já pertence a uma oficina");

  await admin
    .from("profiles")
    .upsert({ id: userId, workshop_id: inv.workshop_id }, { onConflict: "id" });
  await admin
    .from("user_roles")
    .insert({ user_id: userId, workshop_id: inv.workshop_id, role: inv.role });
  await admin
    .from("workshop_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", inv.id);
  return { workshopId: inv.workshop_id };
}

async function listMembers(userId: string, admin: Admin) {
  const { data: prof } = await admin
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .single();
  const wsId = prof?.workshop_id;
  if (!wsId) return { members: [], invites: [] };

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, nome, avatar_url")
    .eq("workshop_id", wsId);
  const { data: roles } = await admin
    .from("user_roles")
    .select("user_id, role")
    .eq("workshop_id", wsId);
  const { data: invites } = await admin
    .from("workshop_invites")
    .select("id, email, role, token, expires_at, used_at, criada_em")
    .eq("workshop_id", wsId)
    .is("used_at", null)
    .order("criada_em", { ascending: false });

  const members = (profiles ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    avatar_url: p.avatar_url,
    roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
  }));
  return { members, invites: invites ?? [] };
}

async function removeMember(userId: string, data: { userId: string }, admin: Admin) {
  if (userId === data.userId) throw new Error("Você não pode remover a si mesmo");

  const { data: prof } = await admin
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .single();
  const wsId = prof?.workshop_id;
  if (!wsId) throw new Error("Sem oficina");

  const { data: role } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("workshop_id", wsId)
    .eq("role", "dono")
    .maybeSingle();
  if (!role) throw new Error("Apenas donos podem remover membros");

  await admin.from("user_roles").delete().eq("user_id", data.userId).eq("workshop_id", wsId);
  await admin
    .from("profiles")
    .update({ workshop_id: null })
    .eq("id", data.userId)
    .eq("workshop_id", wsId);
  return { ok: true };
}

async function revokeInvite(userId: string, data: { inviteId: string }, admin: Admin) {
  const { data: prof } = await admin
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .single();
  const wsId = prof?.workshop_id;
  if (!wsId) throw new Error("Sem oficina");

  const { data: role } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("workshop_id", wsId)
    .eq("role", "dono")
    .maybeSingle();
  if (!role) throw new Error("Apenas donos");

  await admin.from("workshop_invites").delete().eq("id", data.inviteId).eq("workshop_id", wsId);
  return { ok: true };
}
