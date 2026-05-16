import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const createSchema = z.object({
  nome: z.string().min(1).max(120),
  telefone: z.string().max(40).optional().nullable(),
  endereco: z.string().max(255).optional().nullable(),
});

export const createWorkshop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    // Block if user already has a workshop
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("workshop_id")
      .eq("id", userId)
      .maybeSingle();
    if (prof?.workshop_id) {
      throw new Error("Você já pertence a uma oficina.");
    }

    const { data: ws, error: wsErr } = await supabaseAdmin
      .from("workshops")
      .insert({
        nome: data.nome,
        telefone: data.telefone ?? null,
        endereco: data.endereco ?? null,
        created_by: userId,
      } as never)
      .select("id")
      .single();
    if (wsErr || !ws) throw new Error(wsErr?.message || "Falha ao criar oficina");

    // Ensure profile row
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, workshop_id: ws.id } as never, { onConflict: "id" });

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, workshop_id: ws.id, role: "dono" } as never);

    return { workshopId: ws.id };
  });

const inviteCreateSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(["dono", "mecanico"]).default("mecanico"),
});

export const createInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inviteCreateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("workshop_id")
      .eq("id", userId)
      .single();
    const wsId = prof?.workshop_id;
    if (!wsId) throw new Error("Sem oficina");

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("workshop_id", wsId)
      .eq("role", "dono")
      .maybeSingle();
    if (!role) throw new Error("Apenas donos podem convidar");

    const { data: inv, error } = await supabaseAdmin
      .from("workshop_invites")
      .insert({
        workshop_id: wsId,
        email: data.email.toLowerCase(),
        role: data.role,
        invited_by: userId,
      } as never)
      .select("id, token, email, role, expires_at")
      .single();
    if (error || !inv) throw new Error(error?.message || "Falha ao criar convite");
    return inv;
  });

const acceptSchema = z.object({
  token: z.string().min(10).max(100),
});

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => acceptSchema.parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const userEmail = (context.claims.email as string | undefined)?.toLowerCase();

    const { data: inv, error } = await supabaseAdmin
      .from("workshop_invites")
      .select("id, workshop_id, email, role, expires_at, used_at")
      .eq("token", data.token)
      .maybeSingle();
    if (error || !inv) throw new Error("Convite inválido");
    if (inv.used_at) throw new Error("Convite já utilizado");
    if (new Date(inv.expires_at) < new Date()) throw new Error("Convite expirado");
    if (userEmail && inv.email.toLowerCase() !== userEmail) {
      throw new Error(`Este convite é para ${inv.email}`);
    }

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("workshop_id")
      .eq("id", userId)
      .maybeSingle();
    if (prof?.workshop_id) throw new Error("Você já pertence a uma oficina");

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, workshop_id: inv.workshop_id } as never, { onConflict: "id" });

    await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        workshop_id: inv.workshop_id,
        role: inv.role,
      } as never);

    await supabaseAdmin
      .from("workshop_invites")
      .update({ used_at: new Date().toISOString() } as never)
      .eq("id", inv.id);

    return { workshopId: inv.workshop_id };
  });

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("workshop_id")
      .eq("id", userId)
      .single();
    const wsId = prof?.workshop_id;
    if (!wsId) return { members: [], invites: [] };

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, avatar_url")
      .eq("workshop_id", wsId);

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("workshop_id", wsId);

    const { data: invites } = await supabaseAdmin
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
  });

const removeMemberSchema = z.object({ userId: z.string().uuid() });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => removeMemberSchema.parse(input))
  .handler(async ({ data, context }) => {
    const me = context.userId;
    if (me === data.userId) throw new Error("Você não pode remover a si mesmo");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("workshop_id")
      .eq("id", me)
      .single();
    const wsId = prof?.workshop_id;
    if (!wsId) throw new Error("Sem oficina");

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", me)
      .eq("workshop_id", wsId)
      .eq("role", "dono")
      .maybeSingle();
    if (!role) throw new Error("Apenas donos podem remover membros");

    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("workshop_id", wsId);
    await supabaseAdmin
      .from("profiles")
      .update({ workshop_id: null } as never)
      .eq("id", data.userId)
      .eq("workshop_id", wsId);
    return { ok: true };
  });

const revokeSchema = z.object({ inviteId: z.string().uuid() });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => revokeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("workshop_id")
      .eq("id", me)
      .single();
    const wsId = prof?.workshop_id;
    if (!wsId) throw new Error("Sem oficina");
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", me)
      .eq("workshop_id", wsId)
      .eq("role", "dono")
      .maybeSingle();
    if (!role) throw new Error("Apenas donos");
    await supabaseAdmin
      .from("workshop_invites")
      .delete()
      .eq("id", data.inviteId)
      .eq("workshop_id", wsId);
    return { ok: true };
  });