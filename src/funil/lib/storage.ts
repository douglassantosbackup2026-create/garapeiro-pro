import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/reportError";

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
  version: 3;
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

export function loadPersisted(): FunnelPersisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Omit<FunnelPersisted, "version"> & { version: number };
    if (!data || (data.version !== 2 && data.version !== 3)) return null;
    if (data.version === 2) {
      return {
        ...data,
        version: 3,
        answers: {},
        questionIndex: 0,
        step: "landing",
        earningsCents: 0,
      };
    }
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
        version: 3 as const,
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

/** Upsert lead via edge (service_role) — sem acesso direto anon à tabela. */
export async function maybeInsertLead(
  lead: StoredLead,
  meta: Record<string, unknown>,
  lastStep?: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke("funil-api", {
      body: {
        action: "upsertLead",
        name: lead.name,
        whatsapp: lead.whatsapp,
        email: lead.email || null,
        meta,
        lastStep: lastStep ?? "checkout",
        createdAt: lead.createdAt,
      },
    });
    if (error) {
      reportError(error, "funil.upsertLead");
      return { ok: false as const, reason: "api" as const };
    }
    if (!(data as { ok?: boolean })?.ok) {
      return { ok: false as const, reason: "api" as const };
    }
    return { ok: true as const };
  } catch (e) {
    reportError(e, "funil.upsertLead");
    return { ok: false as const, reason: "network" as const };
  }
}

/** Atualiza last_step do lead via edge (best-effort CRM). */
export async function touchLeadStep(
  whatsapp: string,
  lastStep: string,
  meta?: Record<string, unknown>,
) {
  if (!whatsapp) return;

  try {
    const { error } = await supabase.functions.invoke("funil-api", {
      body: {
        action: "touchLeadStep",
        whatsapp,
        lastStep,
        meta,
      },
    });
    if (error) reportError(error, "funil.touchLeadStep");
  } catch (e) {
    reportError(e, "funil.touchLeadStep");
  }
}

/** Link wa.me para follow-up de abandono (uso interno / CRM futuro). */
export function buildWhatsappRecoveryLink(lead: StoredLead, message?: string) {
  const text =
    message ??
    `Oi ${lead.name.split(" ")[0]}! Vi que você fez o diagnóstico OficinaPRO — ainda quer o Método?`;
  return `https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
