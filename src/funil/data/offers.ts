export type OfferId = "playbook" | "recuperador" | "kit-templates" | "metodo-3km";

export type OfferItem = {
  id: OfferId;
  title: string;
  subtitle: string;
  description: string;
  /** Preço exibido (deve espelhar supabase/functions/_shared/funilCatalog.ts). */
  priceLabel: string;
  priceCents: number;
  pdfPath: string;
  pdfFileName: string;
  isMain: boolean;
  badge?: string;
};

export const mainOffer: OfferItem = {
  id: "playbook",
  title: "Método OficinaPRO",
  subtitle: "50 estratégias para oficinas",
  description:
    "O manual completo em 6 partes: atrair clientes, converter orçamentos, subir ticket, fidelizar, organizar e economizar tempo. Sua base para executar o diagnóstico.",
  priceLabel: "R$ 47",
  priceCents: 4700,
  pdfPath: "/playbook-oficinapro.pdf",
  pdfFileName: "Playbook-OficinaPRO.pdf",
  isMain: true,
  badge: "Oferta principal",
};

export const orderBumps: OfferItem[] = [
  {
    id: "recuperador",
    title: "Recuperador de Orçamentos",
    subtitle: "Scripts de follow-up prontos",
    description:
      "Sequências de WhatsApp e e-mail para reativar orçamentos parados e recuperar vendas que você já quase fechou.",
    priceLabel: "R$ 27",
    priceCents: 2700,
    pdfPath: "/recuperador-orcamentos.pdf",
    pdfFileName: "Recuperador-Orcamentos.pdf",
    isMain: false,
    badge: "Mais escolhido",
  },
  {
    id: "kit-templates",
    title: "Kit Templates",
    subtitle: "50 modelos prontos",
    description:
      "Modelos de orçamento, OS, mensagens e checklists para padronizar a comunicação e cortar tempo de digitação.",
    priceLabel: "R$ 37",
    priceCents: 3700,
    pdfPath: "/kit-templates.pdf",
    pdfFileName: "Kit-Templates-OficinaPRO.pdf",
    isMain: false,
  },
  {
    id: "metodo-3km",
    title: "Método 3 KM",
    subtitle: "Parcerias locais que geram OS",
    description:
      "Roteiro para montar parcerias num raio de 3 km: abordagem, proposta e acompanhamento com postos, lojas e frotas.",
    priceLabel: "R$ 27",
    priceCents: 2700,
    pdfPath: "/metodo-3km.pdf",
    pdfFileName: "Metodo-3KM.pdf",
    isMain: false,
  },
];

export const allOffers: OfferItem[] = [mainOffer, ...orderBumps];

/** Bônus SaaS incluso na compra do Método (editável) */
export const saasTrialBonus = {
  days: 14,
  title: "Incluso: 14 dias grátis do OficinaPRO",
  shortLabel: "Bônus: trial 14 dias OficinaPRO",
  description:
    "Acesso ao sistema para colocar o Método em prática — OS, agenda, clientes e financeiro no mesmo lugar.",
  priceLabel: "R$ 0",
  ctaLabel: "Ativar 14 dias grátis no OficinaPRO",
} as const;

export function getOfferById(id: OfferId): OfferItem | undefined {
  return allOffers.find((o) => o.id === id);
}

export function formatTotalCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
