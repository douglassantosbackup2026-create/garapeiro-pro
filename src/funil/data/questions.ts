export type CategoryId =
  | "clientes"
  | "orcamentos"
  | "ticket"
  | "retorno"
  | "organizacao"
  | "tempo";

export type AnswerOption = {
  id: string;
  label: string;
  /** 0 = crítico, 1 = intermediário, 2 = sólido */
  score: 0 | 1 | 2;
};

export type Question = {
  id: string;
  category: CategoryId;
  title: string;
  subtitle?: string;
  options: AnswerOption[];
};

/** Quiz híbrido: aquisição + orçamento + retorno + ticket + bloqueio + pré-venda */
export const questions: Question[] = [
  {
    id: "q1",
    category: "clientes",
    title: "Hoje, quantos clientes novos sua oficina recebe por semana?",
    subtitle: "Aquisição",
    options: [
      { id: "a", label: "Nenhum ou quase nenhum", score: 0 },
      { id: "b", label: "1 a 5 por semana", score: 1 },
      { id: "c", label: "5 a 10 por semana", score: 2 },
      { id: "d", label: "Mais de 10 por semana", score: 2 },
    ],
  },
  {
    id: "q2",
    category: "clientes",
    title: "Você tem um método previsível pra atrair novos clientes?",
    subtitle: "Previsibilidade",
    options: [
      { id: "a", label: "Sim, todo mês entra cliente novo", score: 2 },
      { id: "b", label: "Mais ou menos — depende do mês", score: 1 },
      { id: "c", label: "Não tenho — fica no boca a boca", score: 0 },
    ],
  },
  {
    id: "q3",
    category: "retorno",
    title: "Quantos clientes você já perdeu nos últimos 3 meses?",
    subtitle: "Perda",
    options: [
      { id: "a", label: "Muitos — sinto que sumiram", score: 0 },
      { id: "b", label: "Alguns", score: 1 },
      { id: "c", label: "Não sei — não acompanho", score: 0 },
      { id: "d", label: "Nenhum, pelo que eu vejo", score: 2 },
    ],
  },
  {
    id: "q4",
    category: "retorno",
    title: "Você faz algum tipo de ação pra trazer clientes antigos de volta?",
    subtitle: "Recuperação",
    options: [
      { id: "a", label: "Sim, sempre (WhatsApp, lembrete, campanha)", score: 2 },
      { id: "b", label: "Às vezes, sem constância", score: 1 },
      { id: "c", label: "Nunca — só espero o cliente aparecer", score: 0 },
    ],
  },
  {
    id: "q5",
    category: "ticket",
    title: "Seu faturamento mensal hoje está mais próximo de:",
    subtitle: "Faturamento",
    options: [
      { id: "a", label: "Até R$ 2.000", score: 0 },
      { id: "b", label: "R$ 2.000 – R$ 5.000", score: 1 },
      { id: "c", label: "R$ 5.000 – R$ 10.000", score: 1 },
      { id: "d", label: "R$ 10.000 ou mais", score: 2 },
    ],
  },
  {
    id: "q6",
    category: "organizacao",
    title: "Você acredita que poderia faturar mais… se tivesse mais clientes?",
    subtitle: "Consciência",
    options: [
      { id: "a", label: "Sim, com certeza", score: 2 },
      { id: "b", label: "Talvez", score: 1 },
      { id: "c", label: "Não sei", score: 0 },
    ],
  },
  {
    id: "q7",
    category: "tempo",
    title: "O que mais te impede de faturar mais hoje?",
    subtitle: "Bloqueio",
    options: [
      { id: "a", label: "Falta de clientes", score: 0 },
      { id: "b", label: "Falta de tempo no dia a dia", score: 1 },
      { id: "c", label: "Falta de estratégia clara", score: 0 },
      { id: "d", label: "Falta de dinheiro pra investir", score: 1 },
    ],
  },
  {
    id: "q8",
    category: "orcamentos",
    title:
      "Se existisse um método simples pra trazer clientes todos os dias, você aplicaria?",
    subtitle: "Pré-venda",
    options: [
      { id: "a", label: "Sim, imediatamente", score: 2 },
      { id: "b", label: "Talvez — dependendo do que for", score: 1 },
      { id: "c", label: "Não tenho interesse agora", score: 0 },
    ],
  },
];
