export const CATEGORY_GROUPS = [
  {
    key: "mecanica",
    label: "Mecânica",
    subcategories: [
      { value: "mecanica_geral", label: "Mecânica Geral" },
      { value: "mecanica_diesel", label: "Mecânica Diesel" },
      { value: "cambio", label: "Câmbio Automático" },
      { value: "suspensao", label: "Suspensão e Direção" },
      { value: "freios", label: "Freios" },
      { value: "injecao", label: "Injeção Eletrônica" },
      { value: "ar_condicionado", label: "Ar-Condicionado" },
      { value: "troca_oleo", label: "Troca de Óleo" },
      { value: "alinhamento", label: "Alinhamento e Balanceamento" },
      { value: "borracharia", label: "Borracharia" },
      { value: "escapamento", label: "Escapamentos" },
      { value: "arrefecimento", label: "Radiadores e Arrefecimento" },
    ],
  },
  {
    key: "eletrica",
    label: "Elétrica e Tecnologia",
    subcategories: [
      { value: "autoeletrica", label: "Autoelétrica" },
      { value: "som_audio", label: "Som Automotivo" },
      { value: "alarme_rastreador", label: "Alarmes e Rastreadores" },
      { value: "insulfilm", label: "Insulfilm" },
      { value: "multimidia", label: "Multimídia e Câmeras" },
      { value: "chave", label: "Programação de Chave" },
      { value: "modulos", label: "Reparo de Módulos" },
      { value: "diagnostico", label: "Diagnóstico Computadorizado" },
    ],
  },
  {
    key: "funilaria",
    label: "Funilaria e Pintura",
    subcategories: [
      { value: "funilaria", label: "Funilaria" },
      { value: "pintura", label: "Pintura Automotiva" },
      { value: "martelinho", label: "Martelinho de Ouro" },
      { value: "smart_repair", label: "Smart Repair" },
      { value: "parachoque", label: "Recuperação de Para-Choque" },
      { value: "polimento", label: "Polimento Técnico" },
      { value: "vitrificacao", label: "Vitrificação" },
    ],
  },
  {
    key: "estetica",
    label: "Estética Automotiva",
    subcategories: [
      { value: "lavagem", label: "Lavagem Detalhada" },
      { value: "higienizacao", label: "Higienização Interna" },
      { value: "cristalizacao", label: "Cristalização" },
      { value: "envelopamento", label: "Envelopamento" },
      { value: "ppf", label: "PPF (Película de Proteção)" },
      { value: "farois", label: "Revitalização de Faróis" },
      { value: "limpeza_motor", label: "Limpeza de Motor" },
      { value: "couro", label: "Hidratação de Couro" },
    ],
  },
  {
    key: "pneus",
    label: "Pneus e Rodas",
    subcategories: [
      { value: "pneus", label: "Pneus" },
      { value: "rodas_reforma", label: "Reforma de Rodas" },
      { value: "rodas_pintura", label: "Pintura de Rodas" },
      { value: "cambagem", label: "Cambagem" },
      { value: "geometria", label: "Geometria" },
    ],
  },
  {
    key: "vidros",
    label: "Vidros e Acessórios",
    subcategories: [
      { value: "vidros", label: "Troca de Vidros" },
      { value: "parabrisa", label: "Reparo de Para-Brisa" },
      { value: "teto_solar", label: "Teto Solar" },
      { value: "acessorios", label: "Instalação de Acessórios" },
      { value: "engate", label: "Engate e Reboque" },
      { value: "capota", label: "Capotas Marítimas" },
    ],
  },
  {
    key: "performance",
    label: "Performance e Customização",
    subcategories: [
      { value: "preparacao_motor", label: "Preparação de Motores" },
      { value: "ecu", label: "Reprogramação ECU (Chip)" },
      { value: "turbo", label: "Turbo" },
      { value: "escape_esportivo", label: "Escape Esportivo" },
      { value: "suspensao_esportiva", label: "Suspensão Esportiva" },
      { value: "customizacao", label: "Customização Automotiva" },
      { value: "som_premium", label: "Som Automotivo Premium" },
    ],
  },
  {
    key: "outros",
    label: "Outros",
    subcategories: [{ value: "outros", label: "Outros" }],
  },
] as const;

export type MainCategory = (typeof CATEGORY_GROUPS)[number]["key"];
export type SubCategory = (typeof CATEGORY_GROUPS)[number]["subcategories"][number]["value"];

type SubItem = { value: string; label: string };
export const ALL_SUBCATEGORIES: SubItem[] = CATEGORY_GROUPS.flatMap(
  (g) => g.subcategories as readonly SubItem[],
);

export function getSubcategoryLabel(value: string): string {
  return ALL_SUBCATEGORIES.find((s) => s.value === value)?.label ?? value;
}

export function getGroupForSubcategory(value: string): (typeof CATEGORY_GROUPS)[number] | undefined {
  return CATEGORY_GROUPS.find((g) => g.subcategories.some((s) => s.value === value));
}

export function getGroupLabel(value: string): string {
  return getGroupForSubcategory(value)?.label ?? "Outros";
}

export const CATEGORY_COLORS: Record<MainCategory, string> = {
  mecanica: "bg-blue-100 text-blue-800",
  eletrica: "bg-yellow-100 text-yellow-800",
  funilaria: "bg-red-100 text-red-800",
  estetica: "bg-purple-100 text-purple-800",
  pneus: "bg-gray-100 text-gray-800",
  vidros: "bg-cyan-100 text-cyan-800",
  performance: "bg-orange-100 text-orange-800",
  outros: "bg-muted text-muted-foreground",
};
