import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.24.2";
import type { Database } from "../_shared/database.types.ts";

const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");
const ALLOWED_ORIGINS = allowedOriginsEnv
  ? allowedOriginsEnv.split(",").map((s) => s.trim()).filter(Boolean)
  : null;
const LOVABLE_HOST_RE = /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovable\.dev|lovableproject\.com)$/i;

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
  if (!ALLOWED_ORIGINS) {
    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
    } else if (!origin) {
      headers["Access-Control-Allow-Origin"] = "*";
    }
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (origin && LOVABLE_HOST_RE.test(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}
function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get("Origin");
  if (!ALLOWED_ORIGINS) {
    if (!origin) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin) || LOVABLE_HOST_RE.test(origin);
}

const BodySchema = z.object({ action: z.enum(["seed", "clear"]) });

const DEMO_TAG = "[DEMO]";

/** Nomes e placas fictícios para o ambiente de demonstração. */
const CLIENTS = [
  { nome: "Ana Ribeiro", telefone: "11987650001", data_aniversario: "1988-03-14" },
  { nome: "Carlos Mendes", telefone: "11987650002", data_aniversario: "1975-11-02" },
  { nome: "Fernanda Souza", telefone: "11987650003", data_aniversario: null },
  { nome: "João Batista", telefone: "11987650004", data_aniversario: "1980-06-22" },
  { nome: "Marina Costa", telefone: "11987650005", data_aniversario: null },
  { nome: "Pedro Almeida", telefone: "11987650006", data_aniversario: "1992-09-10" },
  { nome: "Rafael Torres", telefone: "11987650007", data_aniversario: null },
  { nome: "Vanessa Lima", telefone: "11987650008", data_aniversario: "1985-12-01" },
];

const VEHICLES = [
  { placa: "ABC1D23", marca: "Fiat", modelo: "Uno", ano: 2015, km: 82000 },
  { placa: "DEF2E34", marca: "VW", modelo: "Gol", ano: 2018, km: 65000 },
  { placa: "GHI3F45", marca: "Chevrolet", modelo: "Onix", ano: 2020, km: 42000 },
  { placa: "JKL4G56", marca: "Honda", modelo: "Civic", ano: 2016, km: 98000 },
  { placa: "MNO5H67", marca: "Toyota", modelo: "Corolla", ano: 2019, km: 55000 },
  { placa: "PQR6I78", marca: "Hyundai", modelo: "HB20", ano: 2021, km: 30000 },
  { placa: "STU7J89", marca: "Renault", modelo: "Sandero", ano: 2017, km: 78000 },
  { placa: "VWX8K90", marca: "Ford", modelo: "Ka", ano: 2019, km: 60000 },
  { placa: "YZA9L01", marca: "Nissan", modelo: "Versa", ano: 2020, km: 45000 },
  { placa: "BCD1M12", marca: "Jeep", modelo: "Renegade", ano: 2018, km: 72000 },
  { placa: "EFG2N23", marca: "Peugeot", modelo: "208", ano: 2016, km: 88000 },
  { placa: "HIJ3O34", marca: "Fiat", modelo: "Argo", ano: 2022, km: 20000 },
];

const STATUSES: Array<Database["public"]["Enums"]["os_status"]> = [
  "aguardando_aprovacao",
  "em_andamento",
  "concluido",
  "entregue",
];

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(req)) return new Response("Forbidden", { status: 403, headers: corsHeaders });
    return new Response("ok", { headers: corsHeaders });
  }
  const respond = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (!isOriginAllowed(req)) return respond({ error: "Origin not allowed" }, 403);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return respond({ error: "Unauthorized" }, 401);

    const admin = createClient<Database>(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const {
      data: { user },
      error: authErr,
    } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return respond({ error: "Unauthorized" }, 401);

    // Requer dono da oficina
    const { data: prof } = await admin
      .from("profiles")
      .select("workshop_id")
      .eq("id", user.id)
      .maybeSingle();
    const wsId = prof?.workshop_id;
    if (!wsId) return respond({ error: "Sem oficina" }, 400);

    const { data: dono } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("workshop_id", wsId)
      .eq("role", "dono")
      .maybeSingle();
    if (!dono) return respond({ error: "Apenas o dono pode gerenciar dados de demonstração" }, 403);

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return respond({ error: parsed.error.issues[0].message }, 400);

    if (parsed.data.action === "clear") {
      // Ordem: OS (cascata em items/pagamentos), depois veículos, clientes, peças.
      const { data: demoClients } = await admin
        .from("clients")
        .select("id")
        .eq("workshop_id", wsId)
        .ilike("nome", `${DEMO_TAG}%`);
      const clientIds = (demoClients ?? []).map((c) => c.id);
      let deleted = 0;
      if (clientIds.length) {
        const { count: osCount } = await admin
          .from("service_orders")
          .delete({ count: "exact" })
          .in("client_id", clientIds);
        deleted += osCount ?? 0;
        const { count: vCount } = await admin
          .from("vehicles")
          .delete({ count: "exact" })
          .in("client_id", clientIds);
        deleted += vCount ?? 0;
        const { count: cCount } = await admin
          .from("clients")
          .delete({ count: "exact" })
          .in("id", clientIds);
        deleted += cCount ?? 0;
      }
      const { count: pCount } = await admin
        .from("parts_inventory")
        .delete({ count: "exact" })
        .eq("workshop_id", wsId)
        .ilike("nome", `${DEMO_TAG}%`);
      deleted += pCount ?? 0;
      return respond({ ok: true, deleted });
    }

    // seed
    // Idempotência: se já existir cliente demo, não recria.
    const { count: existing } = await admin
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("workshop_id", wsId)
      .ilike("nome", `${DEMO_TAG}%`);
    if ((existing ?? 0) > 0) {
      return respond({ ok: true, created: 0, note: "Dados de demonstração já existem" });
    }

    let created = 0;

    const clientsRows = CLIENTS.map((c) => ({
      ...c,
      nome: `${DEMO_TAG} ${c.nome}`,
      workshop_id: wsId,
    }));
    const { data: insertedClients, error: cErr } = await admin
      .from("clients")
      .insert(clientsRows)
      .select("id");
    if (cErr) throw cErr;
    created += insertedClients?.length ?? 0;

    const vehiclesRows = VEHICLES.map((v, i) => ({
      ...v,
      workshop_id: wsId,
      client_id: insertedClients![i % insertedClients!.length].id,
    }));
    const { data: insertedVehicles, error: vErr } = await admin
      .from("vehicles")
      .insert(vehiclesRows)
      .select("id, client_id");
    if (vErr) throw vErr;
    created += insertedVehicles?.length ?? 0;

    const now = Date.now();
    const osRows = insertedVehicles!.map((v, i) => {
      const daysAgo = i * 6;
      return {
        workshop_id: wsId,
        client_id: v.client_id,
        vehicle_id: v.id,
        status: STATUSES[i % STATUSES.length],
        data_entrada: new Date(now - daysAgo * 24 * 3600 * 1000).toISOString(),
        total: 200 + (i * 137) % 1200,
        observacoes: `${DEMO_TAG} OS de demonstração #${i + 1}`,
        categoria: "mecanica_geral" as const,
      };
    });
    // Duplica algumas para chegar em ~20
    const osFinal = [...osRows, ...osRows.slice(0, 8)];
    const { data: insertedOS, error: osErr } = await admin
      .from("service_orders")
      .insert(osFinal)
      .select("id, status, total");
    if (osErr) throw osErr;
    created += insertedOS?.length ?? 0;

    // Pagamentos parciais em 6 OS entregues/concluídas
    const paidCandidates = (insertedOS ?? []).filter((o) =>
      o.status === "entregue" || o.status === "concluido",
    ).slice(0, 6);
    if (paidCandidates.length) {
      const paymentsRows = paidCandidates.map((o) => ({
        service_order_id: o.id,
        workshop_id: wsId,
        valor: Number(o.total) / 2,
        forma: "pix" as const,
        observacoes: `${DEMO_TAG} sinal pago`,
      }));
      const { count: payCount } = await admin
        .from("payments")
        .insert(paymentsRows, { count: "exact" });
      created += payCount ?? paymentsRows.length;
    }

    // Peças de estoque
    const parts = [
      { nome: "Filtro de óleo Mann", quantidade: 12, preco_venda: 35 },
      { nome: "Filtro de ar Tecfil", quantidade: 8, preco_venda: 45 },
      { nome: "Pastilha de freio dianteira", quantidade: 5, preco_venda: 180 },
      { nome: "Óleo 5W30 sintético (litro)", quantidade: 40, preco_venda: 55 },
      { nome: "Correia dentada Gates", quantidade: 3, preco_venda: 230 },
      { nome: "Vela de ignição NGK (kit 4)", quantidade: 10, preco_venda: 120 },
      { nome: "Amortecedor dianteiro", quantidade: 2, preco_venda: 280 },
      { nome: "Bateria Moura 60Ah", quantidade: 4, preco_venda: 450 },
    ];
    const partsRows = parts.map((p) => ({
      ...p,
      nome: `${DEMO_TAG} ${p.nome}`,
      workshop_id: wsId,
      quantidade_minima: 2,
    }));
    const { count: partsCount } = await admin
      .from("parts_inventory")
      .insert(partsRows, { count: "exact" });
    created += partsCount ?? partsRows.length;

    return respond({ ok: true, created });
  } catch (err) {
    console.error("seed-demo-data", err);
    return respond({ error: (err as Error).message || "Falha interna" }, 500);
  }
});