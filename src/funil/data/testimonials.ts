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
  {
    id: "sergio",
    name: "Sérgio · Ar Condicionado Automotivo",
    role: "Ar Frio Auto",
    city: "Salvador/BA",
    avatarColor: "bg-cyan-600",
    messages: [
      {
        kind: "in",
        text: "Mano, o carro da semana foi a agenda de higienização de ar",
        time: "11:04",
      },
      { kind: "out", text: "Tá com demanda boa?", time: "11:06" },
      {
        kind: "in",
        text: "Boa? Tô com 3 dias seguidos lotado. O cliente chega p/ trocar o óleo e sai com higienização",
        time: "11:07",
      },
      {
        kind: "money",
        text: "R$ 4.850 em 9 dias ❄️",
        time: "11:08",
      },
      {
        kind: "in",
        text: "Antes eu só fazia a carga de gás e deixava o resto na mesa",
        time: "11:08",
      },
    ],
  },
  {
    id: "carla",
    name: "Carla · Troca de Óleo Preventiva",
    role: "Lubrificar BH",
    city: "Belo Horizonte/MG",
    avatarColor: "bg-orange-500",
    messages: [
      { kind: "in", text: "Bom dia! Preciso te falar a novidade", time: "08:15" },
      {
        kind: "in",
        text: "Parei de vender só troca de óleo e comecei a oferecer o pacote de revisão",
        time: "08:15",
      },
      { kind: "out", text: "E aí, aumentou o ticket?", time: "08:17" },
      {
        kind: "in",
        text: "Muito! A clientela leiga não sabia que precisava trocar o filtro de cabine",
        time: "08:18",
      },
      {
        kind: "money",
        text: "R$ 6.210 na primeira semana de pacote 🛠️",
        time: "08:19",
      },
      { kind: "in", text: "Agora todo cliente leva 3 serviços no mínimo", time: "08:20" },
    ],
  },
  {
    id: "ricardo",
    name: "Ricardo · Suspensão e Freios",
    role: "Freio Forte",
    city: "Fortaleza/CE",
    avatarColor: "bg-red-700",
    messages: [
      {
        kind: "in",
        text: "Chefe, aquele lance de inspecionar o freio junto com a suspensão deu certo",
        time: "15:42",
      },
      { kind: "out", text: "Show! Conta os números", time: "15:44" },
      {
        kind: "in",
        text: "Antes fazia só o amortecedor. Agora o cliente sai com disco + pastilha + bucha",
        time: "15:45",
      },
      {
        kind: "money",
        text: "R$ 9.680 no mês passado 🚗",
        time: "15:45",
      },
      {
        kind: "in",
        text: "E ainda sobra estoque de peça que eu vendia errado",
        time: "15:46",
      },
    ],
  },
  {
    id: "tatiana",
    name: "Tatiana · Injeção Eletrônica",
    role: "Scanner RS",
    city: "Porto Alegre/RS",
    avatarColor: "bg-purple-600",
    messages: [
      {
        kind: "in",
        text: "To aqui passada 😂",
        time: "19:30",
      },
      {
        kind: "in",
        text: "Comecei a cobrar o diagnóstico com scanner e a galera tá pagando sem reclamar",
        time: "19:30",
      },
      { kind: "out", text: "Valor do diagnóstico tá no preço certo?", time: "19:32" },
      {
        kind: "in",
        text: "150 conto. Quem recusa não é meu público. Quem aceita fecha a manutenção",
        time: "19:33",
      },
      {
        kind: "money",
        text: "R$ 7.330 em 15 dias 💻",
        time: "19:34",
      },
      { kind: "in", text: "Meu scanner se pagou em 2 semanas", time: "19:35" },
    ],
  },
  {
    id: "leandro",
    name: "Leandro · Martelinho de Ouro",
    role: "LD Martelinho",
    city: "Brasília/DF",
    avatarColor: "bg-yellow-600",
    messages: [
      { kind: "in", text: "Mestre, o fechamento do mês saiu", time: "21:05" },
      {
        kind: "in",
        text: "Botei um atendente pra responder o zap e só eu fazer o serviço",
        time: "21:05",
      },
      { kind: "out", text: "Fluxo de agendamento funcionou?", time: "21:07" },
      {
        kind: "in",
        text: "Funcionou demais. Agora o cliente manda a foto do amassado e eu já orçamento no ato",
        time: "21:08",
      },
      {
        kind: "money",
        text: "R$ 11.200 no mês de martelinho 🏅",
        time: "21:09",
      },
      { kind: "in", text: "Nem preciso sair da oficina pra fazer venda", time: "21:10" },
    ],
  },
  {
    id: "jessica",
    name: "Jéssica · Higienização de Ar e Estofados",
    role: "Limpa Carro",
    city: "Manaus/AM",
    avatarColor: "bg-teal-500",
    messages: [
      {
        kind: "in",
        text: "Olha o que aconteceu depois do post de higienização de ar",
        time: "10:10",
      },
      {
        kind: "in",
        text: "Expliquei que cheiro de mofo é bactéria. As mães enlouqueceram",
        time: "10:11",
      },
      { kind: "out", text: "Agenda lotou?", time: "10:12" },
      {
        kind: "in",
        text: "Lotou. Sábado e domingo agora tão com hora marcada",
        time: "10:13",
      },
      {
        kind: "money",
        text: "R$ 3.420 em 1 fds 🫧",
        time: "10:13",
      },
      {
        kind: "in",
        text: "Minha cliente de um mês atrás voltou com 3 amigas",
        time: "10:14",
      },
    ],
  },
  {
    id: "bruno",
    name: "Bruno · Auto Center Multimarcas",
    role: "Bruno Auto Center",
    city: "São Paulo/SP",
    avatarColor: "bg-slate-600",
    messages: [
      { kind: "in", text: "Chefe, tô com um mês que deu gosto de ver", time: "17:50" },
      {
        kind: "in",
        text: "Centralizei tudo no zap: agendamento, orçamento e aprovação. Ninguém mais liga",
        time: "17:50",
      },
      { kind: "out", text: "Conseguiu organizar o fluxo?", time: "17:52" },
      {
        kind: "in",
        text: "Consegui. E o ticket médio subiu porque parei de cobrar só mão de obra",
        time: "17:53",
      },
      {
        kind: "money",
        text: "R$ 18.900 no mês — recorde da oficina 🔥",
        time: "17:53",
      },
      { kind: "in", text: "Do ano passado pra cá nunca tinha passado dos 9k", time: "17:54" },
    ],
  },
];
