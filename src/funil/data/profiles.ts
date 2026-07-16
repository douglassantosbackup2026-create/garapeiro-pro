import type { CategoryId } from "./questions";

export type ProfileId =
  | "fuga-faturamento"
  | "conversao-frágil"
  | "crescimento-travado"
  | "oficina-pronta";

export type Profile = {
  id: ProfileId;
  title: string;
  headline: string;
  description: string;
  opportunityLabel: string;
  accent: "primary" | "money";
};

export const profiles: Record<ProfileId, Profile> = {
  "fuga-faturamento": {
    id: "fuga-faturamento",
    title: "Dinheiro vazando na oficina",
    headline: "Sua oficina deixa dinheiro na mesa todo mês",
    description:
      "Os sinais apontam pra vazamentos claros: poucos clientes novos de forma previsível, orçamentos sem cobrança e pouco retorno combinado. O Método ataca exatamente essas frentes.",
    opportunityLabel: "Alto potencial de recuperação",
    accent: "primary",
  },
  "conversao-frágil": {
    id: "conversao-frágil",
    title: "Orçamento que esfria",
    headline: "Você atrai demanda, mas perde na hora de fechar",
    description:
      "O gargalo está entre o orçamento e o serviço aprovado — e no valor que poderia ser maior. Com scripts, templates e um jeito simples de cobrar de novo, você fecha mais sem precisar de mais anúncio.",
    opportunityLabel: "Ganho rápido no fechamento",
    accent: "primary",
  },
  "crescimento-travado": {
    id: "crescimento-travado",
    title: "Oficina que não escala",
    headline: "A operação segura o ritmo, mas não cresce",
    description:
      "Dados espalhados e o dia a dia ainda consomem o dono. Sem rotina clara, as estratégias do Método não viram hábito. O próximo passo é organizar o básico pra crescer de verdade.",
    opportunityLabel: "Pronto pra profissionalizar",
    accent: "money",
  },
  "oficina-pronta": {
    id: "oficina-pronta",
    title: "Oficina no rumo",
    headline: "Base sólida — hora de acelerar com método",
    description:
      "Você já faz muita coisa certa. O Método e os guias complementares servem pra padronizar o que funciona e liberar o próximo nível: mais parceria, ticket e previsibilidade.",
    opportunityLabel: "Otimização e escala",
    accent: "money",
  },
};

export type StrategySnippet = {
  id: string;
  category: CategoryId;
  title: string;
  summary: string;
};

/** Resumos alinhados às 6 partes do Método */
export const strategyBank: StrategySnippet[] = [
  {
    id: "s1",
    category: "clientes",
    title: "Movimento mais estável de clientes",
    summary:
      "Combine indicação pedida de propósito com presença local e Google — não dependa só do boca a boca.",
  },
  {
    id: "s2",
    category: "clientes",
    title: "Parcerias no raio de 3 km",
    summary:
      "Postos, borracharias e lojas de autopeças podem virar fonte constante de OS se houver acordo claro e acompanhamento.",
  },
  {
    id: "s3",
    category: "orcamentos",
    title: "Cobrança em sequência",
    summary:
      "Orçamento sem cobrança some. Defina no outro dia, em 3 dias e em 7 dias com mensagens prontas — recupera serviço esquecido.",
  },
  {
    id: "s4",
    category: "orcamentos",
    title: "Orçamento que vende",
    summary:
      "Clareza de peças, mão de obra, prazo e garantia reduz dúvida. Modelo padronizado fecha mais que preço sozinho.",
  },
  {
    id: "s5",
    category: "ticket",
    title: "Checklist de inspeção",
    summary:
      "Antes de entregar só o pedido, revise itens de segurança e manutenção — o serviço extra necessário sobe o ticket sem pressão.",
  },
  {
    id: "s6",
    category: "ticket",
    title: "Pacotes e combos",
    summary:
      "Ofereça revisão + fluidos ou alinhamento + balanceamento como pacote — mais valor percebido, menos disputa só de preço.",
  },
  {
    id: "s7",
    category: "retorno",
    title: "Pós-venda no calendário",
    summary:
      "WhatsApp de 7 dias + lembrete de revisão no prazo certo traz o cliente de volta sem depender da memória dele.",
  },
  {
    id: "s8",
    category: "retorno",
    title: "Programa de fidelidade simples",
    summary:
      "Cartão ou meta de visitas com benefício claro aumenta recorrência — fidelidade não precisa ser sofisticada.",
  },
  {
    id: "s9",
    category: "organizacao",
    title: "Uma fonte da verdade",
    summary:
      "Cliente, carro e histórico no mesmo lugar evitam retrabalho, cobrança errada e cliente sumido no WhatsApp.",
  },
  {
    id: "s10",
    category: "organizacao",
    title: "Status visível do serviço",
    summary:
      "Cliente e equipe alinhados no andamento do serviço reduzem ligações \"e aí, ficou pronto?\" e estresse no balcão.",
  },
  {
    id: "s11",
    category: "tempo",
    title: "Modelos prontos pra tudo que se repete",
    summary:
      "Mensagens, orçamentos e checklists prontos cortam horas por semana — tempo que volta pra venda e qualidade.",
  },
  {
    id: "s12",
    category: "tempo",
    title: "Delegar com processo",
    summary:
      "Se só o dono sabe o processo, a oficina não cresce. Documente o básico e liberte sua agenda.",
  },
];

export function pickStrategies(
  weakCategories: CategoryId[],
  limit = 4,
): StrategySnippet[] {
  const ordered = [
    ...strategyBank.filter((s) => weakCategories.includes(s.category)),
    ...strategyBank.filter((s) => !weakCategories.includes(s.category)),
  ];
  const seen = new Set<string>();
  const result: StrategySnippet[] = [];
  for (const s of ordered) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    result.push(s);
    if (result.length >= limit) break;
  }
  return result;
}

export function resolveProfile(
  totalScore: number,
  maxScore: number,
  categoryScores: Record<CategoryId, number>,
): ProfileId {
  const ratio = maxScore === 0 ? 0 : totalScore / maxScore;
  const weakOrc =
    (categoryScores.orcamentos ?? 0) <= 1 &&
    (categoryScores.clientes ?? 2) >= 1;
  const weakOps =
    (categoryScores.organizacao ?? 0) + (categoryScores.tempo ?? 0) <= 2;

  if (ratio <= 0.35) return "fuga-faturamento";
  if (weakOrc || (categoryScores.orcamentos ?? 0) + (categoryScores.ticket ?? 0) <= 2)
    return "conversao-frágil";
  if (weakOps && ratio < 0.75) return "crescimento-travado";
  if (ratio >= 0.7) return "oficina-pronta";
  return "crescimento-travado";
}

export function weakCategoriesFromScores(
  categoryScores: Record<CategoryId, { sum: number; count: number }>,
): CategoryId[] {
  return (Object.entries(categoryScores) as [CategoryId, { sum: number; count: number }][])
    .map(([id, v]) => ({
      id,
      avg: v.count === 0 ? 2 : v.sum / v.count,
    }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)
    .map((x) => x.id);
}
