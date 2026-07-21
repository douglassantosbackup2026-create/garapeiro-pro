export type ChatBubble =
  | { kind: "in" | "out"; text: string; time: string }
  | { kind: "money"; text: string; time: string };

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  city: string;
  avatarColor: string; // tailwind bg-* utility for avatar circle
  messages: ChatBubble[];
};

export const testimonials: Testimonial[] = [
  {
    id: "rogerio",
    name: "Rogério · Mecânica geral",
    role: "Oficina do Rogério",
    city: "Contagem/MG",
    avatarColor: "bg-emerald-600",
    messages: [
      { kind: "in", text: "Fala chefe, tô te devendo essa 🙌", time: "09:12" },
      {
        kind: "in",
        text: "Apliquei o script de retorno pros clientes antigos que sumiram",
        time: "09:12",
      },
      { kind: "out", text: "E aí, deu movimento?", time: "09:14" },
      {
        kind: "in",
        text: "Cara, 7 voltaram só essa semana. Um deles trouxe até o carro da esposa",
        time: "09:15",
      },
      {
        kind: "money",
        text: "R$ 3.180 fechados em 6 dias 💰",
        time: "09:15",
      },
      { kind: "in", text: "Semana que vem devo bater os 5k, valeu demais!", time: "09:16" },
    ],
  },
  {
    id: "diego",
    name: "Diego · Funilaria e Pintura",
    role: "DG Auto Center",
    city: "Curitiba/PR",
    avatarColor: "bg-blue-600",
    messages: [
      { kind: "in", text: "Preciso te contar uma coisa", time: "18:02" },
      {
        kind: "in",
        text: "Ajustei o orçamento do jeito que você ensinou, parei de mandar preço solto no zap",
        time: "18:02",
      },
      { kind: "out", text: "Boa! Fechamento subiu?", time: "18:04" },
      {
        kind: "in",
        text: "Subiu MUITO. Agenda tá lotada até dia 20",
        time: "18:05",
      },
      {
        kind: "money",
        text: "R$ 12.400 fechados esse mês 🔧",
        time: "18:05",
      },
      { kind: "in", text: "Pela primeira vez tô podendo escolher serviço", time: "18:06" },
    ],
  },
  {
    id: "alessandra",
    name: "Alessandra · Estética Automotiva",
    role: "Ale Detailing",
    city: "Recife/PE",
    avatarColor: "bg-rose-600",
    messages: [
      { kind: "in", text: "Bom dia! Notícia boa 😄", time: "08:30" },
      {
        kind: "in",
        text: "Rodei a campanha de vitrificação que sugeriu no grupo do bairro",
        time: "08:30",
      },
      { kind: "out", text: "E o retorno?", time: "08:32" },
      {
        kind: "in",
        text: "Sábado inteiro fechado, 6 carros seguidos",
        time: "08:33",
      },
      {
        kind: "money",
        text: "R$ 2.760 em 1 dia ✅",
        time: "08:33",
      },
      {
        kind: "in",
        text: "Já tô com 4 agendados pra próxima. Nunca imaginei isso",
        time: "08:34",
      },
    ],
  },
  {
    id: "marquinhos",
    name: "Marquinhos · Elétrica Automotiva",
    role: "M2 Elétrica",
    city: "Osasco/SP",
    avatarColor: "bg-amber-600",
    messages: [
      {
        kind: "in",
        text: "Aquela ideia de oferecer o teste de bateria junto virou uma máquina",
        time: "14:20",
      },
      { kind: "out", text: "Tá batendo bem?", time: "14:21" },
      {
        kind: "in",
        text: "Praticamente dobrei o ticket. Do nada o cliente sai com bateria nova e scanner",
        time: "14:22",
      },
      {
        kind: "money",
        text: "R$ 8.900 esse mês só de elétrica 💡",
        time: "14:22",
      },
      { kind: "in", text: "Sem gastar 1 real de anúncio", time: "14:23" },
    ],
  },
  {
    id: "juninho",
    name: "Juninho · Pneus e Alinhamento",
    role: "JR Pneus",
    city: "Goiânia/GO",
    avatarColor: "bg-indigo-600",
    messages: [
      { kind: "in", text: "Segue o print do relatório 👇", time: "20:10" },
      {
        kind: "in",
        text: "Botei a campanha de revisão de pneu que a gente montou",
        time: "20:10",
      },
      { kind: "out", text: "Faturamento como ficou?", time: "20:12" },
      {
        kind: "money",
        text: "R$ 5.640 em 12 dias 🚗",
        time: "20:13",
      },
      {
        kind: "in",
        text: "Antes eu vivia esperando o cliente aparecer. Agora tenho fila",
        time: "20:14",
      },
    ],
  },
];