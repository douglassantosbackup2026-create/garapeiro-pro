/** PDFs do Playbook disponíveis no app autenticado após unlock. */
export type PlaybookAsset = {
  id: string;
  title: string;
  subtitle: string;
  pdfPath: string;
  pdfFileName: string;
};

export const playbookAssets: PlaybookAsset[] = [
  {
    id: "playbook",
    title: "Playbook OficinaPRO",
    subtitle: "50 estratégias para oficinas",
    pdfPath: "/playbook-oficinapro.pdf",
    pdfFileName: "Playbook-OficinaPRO.pdf",
  },
  {
    id: "recuperador",
    title: "Recuperador de Orçamentos",
    subtitle: "Scripts de follow-up prontos",
    pdfPath: "/recuperador-orcamentos.pdf",
    pdfFileName: "Recuperador-Orcamentos.pdf",
  },
  {
    id: "kit-templates",
    title: "Kit Templates",
    subtitle: "50 modelos prontos",
    pdfPath: "/kit-templates.pdf",
    pdfFileName: "Kit-Templates-OficinaPRO.pdf",
  },
  {
    id: "metodo-3km",
    title: "Método 3 KM",
    subtitle: "Parcerias locais que geram OS",
    pdfPath: "/metodo-3km.pdf",
    pdfFileName: "Metodo-3KM.pdf",
  },
];

const PLAYBOOK_TRIAL_KEY = "oficinapro-playbook-trial";
const PLAYBOOK_ORDER_KEY = "oficinapro-playbook-order";

type TrialSearch = URLSearchParams | Record<string, unknown>;

function readParam(search: TrialSearch, key: string): string | null {
  if (search instanceof URLSearchParams) return search.get(key);
  const v = search[key];
  return typeof v === "string" ? v : null;
}

/**
 * Persiste intenção de liberar Playbook após cadastro do funil.
 * Exige `trial` numérico; `order` amarra ao funil_orders aprovado (anti-abuso).
 */
export function rememberPlaybookTrialFromSearch(search: TrialSearch) {
  const trial = readParam(search, "trial");
  const order = readParam(search, "order");
  if (!trial || !(Number(trial) > 0)) return;
  try {
    sessionStorage.setItem(PLAYBOOK_TRIAL_KEY, trial);
    if (order) sessionStorage.setItem(PLAYBOOK_ORDER_KEY, order);
  } catch {
    /* ignore */
  }
}

export function peekPlaybookTrialIntent(): boolean {
  try {
    const v = sessionStorage.getItem(PLAYBOOK_TRIAL_KEY);
    return !!v && Number(v) > 0;
  } catch {
    return false;
  }
}

export function peekPlaybookOrderId(): string | null {
  try {
    return sessionStorage.getItem(PLAYBOOK_ORDER_KEY);
  } catch {
    return null;
  }
}

/** Remove intenção de trial (após consumo ou falha). */
export function clearPlaybookTrialIntent() {
  try {
    sessionStorage.removeItem(PLAYBOOK_TRIAL_KEY);
    sessionStorage.removeItem(PLAYBOOK_ORDER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Consome trial só se houver pedido aprovado (via Edge Function).
 * Sem `order` ou pedido não aprovado → não libera (evita ?trial=7 solto).
 */
export async function consumeVerifiedPlaybookTrial(): Promise<boolean> {
  const wantsTrial = peekPlaybookTrialIntent();
  const orderId = peekPlaybookOrderId();
  if (!wantsTrial) return false;
  if (!orderId) {
    clearPlaybookTrialIntent();
    return false;
  }

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("mercado-pago", {
      body: { action: "verifyTrialOrder", orderId },
    });
    clearPlaybookTrialIntent();
    if (error) return false;
    const result = data as { ok?: boolean; approved?: boolean };
    return Boolean(result.ok && result.approved);
  } catch {
    clearPlaybookTrialIntent();
    return false;
  }
}

/** @deprecated Use consumeVerifiedPlaybookTrial — mantido só se algum import antigo existir. */
export function consumePlaybookTrialIntent(): boolean {
  try {
    const v = sessionStorage.getItem(PLAYBOOK_TRIAL_KEY);
    if (!v) return false;
    sessionStorage.removeItem(PLAYBOOK_TRIAL_KEY);
    return Number(v) > 0;
  } catch {
    return false;
  }
}
