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

export const questions: Question[] = [
  {
    id: "q1",
    category: "clientes",
    title: "No mês fraco, o que mais acontece na sua oficina?",
    subtitle: "Agenda",
    options: [
      {
        id: "a",
        label: "Agenda vazia — dependo quase só de indicação",
        score: 0,
      },
      {
        id: "b",
        label: "Varia: uma semana enche, outra esfria",
        score: 1,
      },
      {
        id: "c",
        label: "Tem movimento mais estável (Google, indicação pedida ou parceria)",
        score: 2,
      },
    ],
  },
  {
    id: "q2",
    category: "orcamentos",
    title: "Depois que você manda o orçamento, o que costuma acontecer?",
    subtitle: "Orçamento",
    options: [
      {
        id: "a",
        label: "Muitos somem — eu quase não cobro de novo",
        score: 0,
      },
      {
        id: "b",
        label: "Cobro às vezes, no feeling",
        score: 1,
      },
      {
        id: "c",
        label: "Tenho uma sequência pronta (ex.: no outro dia, em 3 dias…)",
        score: 2,
      },
    ],
  },
  {
    id: "q3",
    category: "ticket",
    title: "Quando o cliente diz que achou mais barato em outro lugar, o que você faz?",
    subtitle: "Preço",
    options: [
      {
        id: "a",
        label: "Baixo o preço ou deixo ir embora",
        score: 0,
      },
      {
        id: "b",
        label: "Explico um pouco o serviço, mas ainda perco bastante",
        score: 1,
      },
      {
        id: "c",
        label: "Mostro o que está incluso (peça, prazo, garantia) e seguro o valor",
        score: 2,
      },
    ],
  },
  {
    id: "q4",
    category: "retorno",
    title: "Depois que o carro sai da oficina, você fala com o cliente de novo?",
    subtitle: "Retorno",
    options: [
      {
        id: "a",
        label: "Só se ele lembrar e voltar",
        score: 0,
      },
      {
        id: "b",
        label: "Mando um Zap de vez em quando",
        score: 1,
      },
      {
        id: "c",
        label: "Tenho lembrete de revisão / retorno combinado",
        score: 2,
      },
    ],
  },
  {
    id: "q5",
    category: "organizacao",
    title: "Onde ficam os dados do cliente e do carro hoje?",
    subtitle: "Controle",
    options: [
      {
        id: "a",
        label: "Na cabeça, no caderno ou espalhado no WhatsApp",
        score: 0,
      },
      {
        id: "b",
        label: "Planilha ou app, mas ainda se perde coisa",
        score: 1,
      },
      {
        id: "c",
        label: "Tudo no mesmo lugar: cliente, carro e histórico",
        score: 2,
      },
    ],
  },
  {
    id: "q6",
    category: "tempo",
    title: "No fim do mês, como você se sente em relação ao lucro?",
    subtitle: "Seu tempo",
    options: [
      {
        id: "a",
        label: "Trabalhei pra caramba e sobrou pouco (ou nada)",
        score: 0,
      },
      {
        id: "b",
        label: "Dá pra pagar as contas, mas aberto demais",
        score: 1,
      },
      {
        id: "c",
        label: "Consigo ver o que sobrou e planejar a semana",
        score: 2,
      },
    ],
  },
];
