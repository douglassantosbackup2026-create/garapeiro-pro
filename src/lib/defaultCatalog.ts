/** Catálogo inicial inserido ao criar a oficina. */
export const DEFAULT_CATALOG_SERVICES: {
  nome: string;
  preco_padrao: number;
  categoria: string;
  duracao_min?: number;
}[] = [
  { nome: "Troca de óleo e filtro", preco_padrao: 180, categoria: "mecanica_geral", duracao_min: 45 },
  { nome: "Revisão preventiva", preco_padrao: 350, categoria: "mecanica_geral", duracao_min: 120 },
  { nome: "Diagnóstico eletrônico", preco_padrao: 150, categoria: "eletrica", duracao_min: 60 },
  { nome: "Alinhamento e balanceamento", preco_padrao: 120, categoria: "suspensao", duracao_min: 60 },
  { nome: "Troca de pastilhas de freio", preco_padrao: 280, categoria: "freios", duracao_min: 90 },
  { nome: "Troca de correia dentada", preco_padrao: 650, categoria: "mecanica_geral", duracao_min: 180 },
  { nome: "Carga de ar-condicionado", preco_padrao: 200, categoria: "ar_condicionado", duracao_min: 60 },
  { nome: "Polimento técnico", preco_padrao: 450, categoria: "estetica", duracao_min: 180 },
  { nome: "Funilaria — painel (mão de obra)", preco_padrao: 800, categoria: "funilaria", duracao_min: 480 },
  { nome: "Pintura — peça avulsa", preco_padrao: 600, categoria: "pintura", duracao_min: 360 },
  { nome: "Troca de bateria", preco_padrao: 100, categoria: "eletrica", duracao_min: 30 },
  { nome: "Geometria / cambagem", preco_padrao: 150, categoria: "suspensao", duracao_min: 60 },
  { nome: "Limpeza de bicos injetores", preco_padrao: 250, categoria: "injecao", duracao_min: 90 },
  { nome: "Troca de amortecedores (par)", preco_padrao: 400, categoria: "suspensao", duracao_min: 120 },
  { nome: "Higienização interna", preco_padrao: 280, categoria: "estetica", duracao_min: 120 },
];
