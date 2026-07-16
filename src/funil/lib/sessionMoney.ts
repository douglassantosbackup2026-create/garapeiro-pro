import { questions } from "@/funil/data/questions";

export type MoneyByAnswer = Record<string, Record<string, number>>;

const SCORE_RANGES_CENTS: Record<0 | 1 | 2, [number, number]> = {
  0: [8000, 18000], // R$ 80–180
  1: [15000, 32000], // R$ 150–320
  2: [25000, 48000], // R$ 250–480
};

const CONTEXT_LABELS = [
  "Follow-up",
  "Balcão",
  "WhatsApp",
  "Revisão",
  "Parceria",
  "Orçamento",
  "Pós-venda",
  "Agenda",
] as const;

const TOAST_TITLES = [
  "Orçamento recuperado no diagnóstico",
  "Cliente reativado no diagnóstico",
  "OS gerada no diagnóstico",
  "Ticket recuperado no diagnóstico",
  "Retorno fechado no diagnóstico",
  "Serviço aprovado no diagnóstico",
] as const;

const TIME_LABELS = ["agora", "1m atrás", "2m atrás", "5m atrás", "8m atrás"] as const;

/** Mulberry32 — PRNG determinístico por seed */
export function createRng(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSessionSeed(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] || 1;
  }
  return (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
}

export function buildMoneyByAnswer(seed: number): MoneyByAnswer {
  const rng = createRng(seed);
  const map: MoneyByAnswer = {};

  for (const q of questions) {
    map[q.id] = {};
    for (const opt of q.options) {
      const [min, max] = SCORE_RANGES_CENTS[opt.score];
      const cents = Math.round(min + rng() * (max - min));
      map[q.id][opt.id] = Math.round(cents / 1000) * 1000;
    }
  }

  return map;
}

/** Contexto curto no toast (substitui nome fictício de pagador). */
export function pickSenderName(seed: number, questionIndex: number): string {
  const idx = (seed + questionIndex * 13) % CONTEXT_LABELS.length;
  return CONTEXT_LABELS[idx]!;
}

export function pickTimeLabel(seed: number, questionIndex: number): string {
  const idx = (seed + questionIndex * 3) % TIME_LABELS.length;
  return TIME_LABELS[idx]!;
}

export function toastTitleFor(
  seed: number,
  questionIndex: number,
  _fromName: string,
): string {
  const idx = (seed + questionIndex * 7) % TOAST_TITLES.length;
  return TOAST_TITLES[idx]!;
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
