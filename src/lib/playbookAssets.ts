/** PDFs do Playbook — servidos via signed URL (Storage privado), não /public. */
export type PlaybookAsset = {
  id: "playbook" | "recuperador" | "kit-templates" | "metodo-3km";
  title: string;
  subtitle: string;
  pdfFileName: string;
};

export const playbookAssets: PlaybookAsset[] = [
  {
    id: "playbook",
    title: "Playbook OficinaPRO",
    subtitle: "50 estratégias para oficinas",
    pdfFileName: "Playbook-OficinaPRO.pdf",
  },
  {
    id: "recuperador",
    title: "Recuperador de Orçamentos",
    subtitle: "Scripts de follow-up prontos",
    pdfFileName: "Recuperador-Orcamentos.pdf",
  },
  {
    id: "kit-templates",
    title: "Kit Templates",
    subtitle: "50 modelos prontos",
    pdfFileName: "Kit-Templates-OficinaPRO.pdf",
  },
  {
    id: "metodo-3km",
    title: "Método 3 KM",
    subtitle: "Parcerias locais que geram OS",
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

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageRemove(key: string) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Persiste intenção de liberar Playbook após cadastro do funil.
 * Exige `trial` numérico; `order` amarra ao funil_orders aprovado (anti-abuso).
 */
export function rememberPlaybookTrialFromSearch(search: TrialSearch) {
  const trial = readParam(search, "trial");
  const order = readParam(search, "order");
  if (!trial || !(Number(trial) > 0)) return;
  storageSet(PLAYBOOK_TRIAL_KEY, trial);
  if (order) storageSet(PLAYBOOK_ORDER_KEY, order);
}

export function peekPlaybookTrialIntent(): boolean {
  const v = storageGet(PLAYBOOK_TRIAL_KEY);
  return !!v && Number(v) > 0;
}

export function peekPlaybookOrderId(): string | null {
  return storageGet(PLAYBOOK_ORDER_KEY);
}

export function clearPlaybookTrialIntent() {
  storageRemove(PLAYBOOK_TRIAL_KEY);
  storageRemove(PLAYBOOK_ORDER_KEY);
}

/**
 * Consome trial só se houver pedido aprovado — unlock no servidor (service_role).
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
    const { unlockPlaybook } = await import("@/lib/workshop.functions");
    await unlockPlaybook({ data: { orderId } });
    clearPlaybookTrialIntent();
    return true;
  } catch {
    clearPlaybookTrialIntent();
    return false;
  }
}

/** @deprecated Use consumeVerifiedPlaybookTrial */
export function consumePlaybookTrialIntent(): boolean {
  try {
    const v = storageGet(PLAYBOOK_TRIAL_KEY);
    if (!v) return false;
    clearPlaybookTrialIntent();
    return Number(v) > 0;
  } catch {
    return false;
  }
}
