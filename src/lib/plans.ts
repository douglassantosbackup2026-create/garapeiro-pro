/** Planos SaaS OficinaPRO — limites e features por `workshops.plano`. */

export type PlanoId = "gratuito" | "solo" | "oficina";

export type PlanFeature =
  | "agenda"
  | "financeiro"
  | "estoque"
  | "relatorios"
  | "equipe"
  | "os_ilimitadas";

export type PlanDefinition = {
  id: PlanoId;
  name: string;
  priceCents: number;
  priceLabel: string;
  maxOsPerMonth: number | null;
  maxUsers: number | null;
  features: PlanFeature[];
};

export const PLANS: Record<PlanoId, PlanDefinition> = {
  gratuito: {
    id: "gratuito",
    name: "Gratuito",
    priceCents: 0,
    priceLabel: "R$ 0",
    maxOsPerMonth: 15,
    maxUsers: 1,
    features: [],
  },
  solo: {
    id: "solo",
    name: "Pro",
    priceCents: 9700,
    priceLabel: "R$ 97",
    maxOsPerMonth: null,
    maxUsers: 3,
    features: ["agenda", "financeiro", "estoque", "relatorios", "equipe", "os_ilimitadas"],
  },
  oficina: {
    id: "oficina",
    name: "Oficina Plus",
    priceCents: 19700,
    priceLabel: "R$ 197",
    maxOsPerMonth: null,
    maxUsers: null,
    features: ["agenda", "financeiro", "estoque", "relatorios", "equipe", "os_ilimitadas"],
  },
};

export function normalizePlano(value: string | null | undefined): PlanoId {
  if (value === "solo" || value === "oficina" || value === "gratuito") return value;
  return "gratuito";
}

export function planHasFeature(plano: PlanoId, feature: PlanFeature): boolean {
  return PLANS[plano].features.includes(feature);
}

export function canCreateOS(plano: PlanoId, osThisMonth: number): boolean {
  const max = PLANS[plano].maxOsPerMonth;
  if (max == null) return true;
  return osThisMonth < max;
}

/** Rotas que exigem plano pago (Pro ou Plus). */
export const GATED_ROUTES: { path: string; feature: PlanFeature }[] = [
  { path: "/agenda", feature: "agenda" },
  { path: "/financeiro", feature: "financeiro" },
  { path: "/estoque", feature: "estoque" },
  { path: "/relatorios", feature: "relatorios" },
];

export function featureForPath(pathname: string): PlanFeature | null {
  for (const g of GATED_ROUTES) {
    if (pathname === g.path || pathname.startsWith(g.path + "/")) return g.feature;
  }
  return null;
}
