/**
 * Catálogo de preços do funil (centavos) — espelhar src/funil/data/offers.ts no servidor.
 * Nunca confiar só no amount vindo do browser.
 */
export const FUNIL_PRICE_CENTS: Record<string, number> = {
  playbook: 4700,
  recuperador: 2700,
  "kit-templates": 3700,
  "metodo-3km": 2700,
};

export function computeOrderAmountCents(offerIds: string[]): number {
  const unique = [...new Set(offerIds.filter(Boolean))];
  if (!unique.includes("playbook")) unique.unshift("playbook");
  return unique.reduce((sum, id) => sum + (FUNIL_PRICE_CENTS[id] ?? 0), 0);
}
