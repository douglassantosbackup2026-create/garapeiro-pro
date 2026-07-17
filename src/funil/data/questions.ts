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
    title: "Hoje, como você consegue a maioria dos seus clientes?",
    subtitle: "Aquisição",
    options: [
      { id: "a", label: "Só indicação — quando alguém lembra de mim", score: 0 },
      { id: "b", label: "Quem passa na rua ou liga do nada", score: 0 },
      { id: "c", label: "WhatsApp / Google, mas sem padrão claro", score: 1 },
      { id: "d", label: "Tenho um jeito previsível de atrair", score: 2 },
    ],
  },
  {
    id: "q2",
    category: "orcamentos",
    title: "Depois que você manda o orçamento, o que costuma acontecer?",
    subtitle: "Orçamento",
    options: [
      { id: "a", label: "Muitos somem — eu quase não cobro de novo", score: 0 },
      { id: "b", label: "Cobro às vezes, no feeling", score: 1 },
      {
        id: "c",
        label: "Tenho uma sequência pronta (outro dia, 3 dias…)",
        score: 2,
      },
    ],
  },
  {
    id: "q3",
    category: "retorno",
    title: "Seus clientes voltam com frequência?",
    subtitle: "Retorno",
    options: [
      { id: "a", label: "Quase nunca — só se eles lembrarem", score: 0 },
      { id: "b", label: "Às vezes, sem eu fazer nada de propósito", score: 1 },
      { id: "c", label: "Sim — tenho lembrete / retorno combinado", score: 2 },
    ],
  },
  {
    id: "q4",
    category: "ticket",
    title: "Quando o cliente diz que achou mais barato em outro lugar, o que você faz?",
    subtitle: "Preço",
    options: [
      { id: "a", label: "Baixo o preço ou deixo ir embora", score: 0 },
      { id: "b", label: "Explico um pouco, mas ainda perco bastante", score: 1 },
      {
        id: "c",
        label: "Mostro o que está incluso e seguro o valor",
        score: 2,
      },
    ],
  },
  {
    id: "q5",
    category: "tempo",
    title: "O que mais te impede de faturar mais hoje?",
    subtitle: "Bloqueio",
    options: [
      { id: "a", label: "Falta de clientes / agenda vazia", score: 0 },
      { id: "b", label: "Falta de tempo no dia a dia", score: 1 },
      { id: "c", label: "Falta de estratégia clara", score: 0 },
      { id: "d", label: "Falta de dinheiro pra investir", score: 1 },
    ],
  },
  {
    id: "q6",
    category: "organizacao",
    title:
      "Se existisse um método simples pra atrair, cobrar e fazer o cliente voltar — você aplicaria?",
    subtitle: "Pré-venda",
    options: [
      { id: "a", label: "Sim, imediatamente", score: 2 },
      { id: "b", label: "Talvez — dependendo do que for", score: 1 },
      { id: "c", label: "Não tenho interesse agora", score: 0 },
    ],
  },
];
