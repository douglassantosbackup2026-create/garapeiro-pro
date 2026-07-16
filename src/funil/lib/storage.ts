import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "oficinapro-funil-v1";

export type StoredLead = {
  name: string;
  whatsapp: string;
  /** Pode ficar vazio no soft lead; exigido no checkout. */
  email: string;
  createdAt: string;
};

export type FunnelStep =
  | "landing"
  | "quiz"
  | "result"
  | "offer"
  | "checkout"
  | "thanks";

/** Step legado `lead` (pré-unificação) → checkout. */
export function normalizeFunnelStep(
  step: string | null | undefined,
): FunnelStep | null {
  if (!step) return null;
  if (step === "lead") return "checkout";
  const allowed: FunnelStep[] = [
    "landing",
    "quiz",
    "result",
    "offer",
    "checkout",
    "thanks",
  ];
  return allowed.includes(step as FunnelStep) ? (step as FunnelStep) : null;
}

export type FunnelPersisted = {
  version: 2;
  /** Pode ser `lead` em sessões antigas — normalizar com normalizeFunnelStep. */
  step: FunnelStep | "lead";
  questionIndex: number;
  answers: Record<string, string>;
  earningsCents: number;
  sessionSeed: number;
  lead: StoredLead | null;
  selectedBumps: string[];
  profileId: string | null;
  totalScore: number;
  /** Última sincronização */
  savedAt: string;
};

type FunilLeadsClient = {
  from: (table: "funil_leads") => {
    upsert: (
      row: Record<string, unknown>,
      opts: { onConflict: string },
    ) => PromiseLike<{ error: { message: string; code?: string } | null }>;
    update: (row: Record<string, unknown>) => {
      eq: (
        col: string,
        val: string,
      ) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
};

function funilLeads() {
  return supabase as unknown as FunilLeadsClient;
}

export function loadPersisted(): FunnelPersisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FunnelPersisted;
    if (!data || data.version !== 2) return null;
    return data;
  } catch {
    return null;
  }
}

export function savePersisted(data: FunnelPersisted) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        version: 2 as const,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    /* ignore quota */
  }
}

export function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Upsert lead por WhatsApp (captura precoce + last_step para CRM). */
export async function maybeInsertLead(
  lead: StoredLead,
  meta: Record<string, unknown>,
  lastStep?: string,
) {
  try {
    const { error } = await funilLeads().from("funil_leads").upsert(
      {
        name: lead.name,
        whatsapp: lead.whatsapp,
        email: lead.email || null,
        meta,
        last_step: lastStep ?? "checkout",
        updated_at: new Date().toISOString(),
        created_at: lead.createdAt,
      },
      { onConflict: "whatsapp" },
    );
    if (error) {
      console.warn("funil_leads upsert:", error.message);
      return { ok: false as const, reason: "api" as const };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "network" as const };
  }
}

/** Atualiza last_step do lead (recuperação WhatsApp / CRM). */
export async function touchLeadStep(
  whatsapp: string,
  lastStep: string,
  meta?: Record<string, unknown>,
) {
  if (!whatsapp) return;

  try {
    const patch: Record<string, unknown> = {
      last_step: lastStep,
      updated_at: new Date().toISOString(),
    };
    if (meta) patch.meta = meta;
    const { error } = await funilLeads()
      .from("funil_leads")
      .update(patch)
      .eq("whatsapp", whatsapp);
    if (error) console.warn("funil_leads update:", error.message);
  } catch {
    /* ignore */
  }
}

/** Link wa.me para follow-up de abandono (uso interno / CRM futuro). */
export function buildWhatsappRecoveryLink(lead: StoredLead, message?: string) {
  const text =
    message ??
    `Oi ${lead.name.split(" ")[0]}! Vi que você fez o diagnóstico OficinaPRO — ainda quer o Método?`;
  return `https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
