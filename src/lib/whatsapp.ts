import { formatBRL, formatDate, formatOSNumber } from "./format";
import type { OSStatus } from "@/hooks/useServiceOrders";

export function buildWhatsappUrl(phone: string, text: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  const final = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${final}?text=${encodeURIComponent(text)}`;
}

export type Workshop = {
  nome: string;
  mensagem_orcamento?: string | null;
  mensagem_atualizacao?: string | null;
  mensagem_retorno?: string | null;
};

export type OSForMessage = {
  numero: number;
  cliente_nome: string;
  veiculo: string;
  placa: string;
  servicos: { descricao: string; valor: number }[];
  pecas: { nome: string; quantidade: number; valor_total: number }[];
  total: number;
  previsao_entrega?: string | null;
  status?: OSStatus;
};

function renderItens(os: OSForMessage): string {
  const parts: string[] = [];
  if (os.servicos.length) {
    parts.push("Serviços:");
    for (const s of os.servicos) parts.push(`- ${s.descricao} — ${formatBRL(s.valor)}`);
  }
  if (os.pecas.length) {
    if (parts.length) parts.push("");
    parts.push("Peças:");
    for (const p of os.pecas)
      parts.push(`- ${p.nome} (x${p.quantidade}) — ${formatBRL(p.valor_total)}`);
  }
  return parts.join("\n");
}

const DEFAULT_ORCAMENTO =
  "Olá {cliente}! 👋\n\nSeu veículo {veiculo} — Placa {placa} está na oficina.\n\n*ORÇAMENTO {numero}*\n\n{itens}\n\n*Total: {total}*\n\nPrevisão de entrega: {previsao}\n\nPara aprovar, responda SIM. ✅\nDúvidas? Fique à vontade para perguntar!";

const DEFAULT_ATUALIZACAO =
  "Olá {cliente}! 👋\n\nAtualização da OS {numero} — {veiculo} (Placa {placa}):\n\nNovo status: *{status}*\n\nQualquer dúvida, é só chamar! 🔧";

const DEFAULT_RETORNO =
  "Olá {cliente}! 👋\n\nAqui é da {oficina}.\n\nFaz um tempo que não vemos você por aqui. Seu {veiculo} — placa {placa} pode estar precisando de revisão.\n\nQuer agendar uma visita? É só me chamar aqui! 🔧";

export function renderOrcamento(os: OSForMessage, workshop: Workshop): string {
  const tpl = workshop.mensagem_orcamento || DEFAULT_ORCAMENTO;
  return tpl
    .replaceAll("{cliente}", os.cliente_nome)
    .replaceAll("{veiculo}", os.veiculo)
    .replaceAll("{placa}", os.placa)
    .replaceAll("{numero}", formatOSNumber(os.numero))
    .replaceAll("{itens}", renderItens(os))
    .replaceAll("{total}", formatBRL(os.total))
    .replaceAll("{previsao}", os.previsao_entrega ? formatDate(os.previsao_entrega) : "a combinar")
    .replaceAll("{oficina}", workshop.nome);
}

export function renderAtualizacao(os: OSForMessage, workshop: Workshop): string {
  const tpl = workshop.mensagem_atualizacao || DEFAULT_ATUALIZACAO;
  const statusLabel = os.status ? STATUS_LABEL[os.status] : "";
  return tpl
    .replaceAll("{cliente}", os.cliente_nome)
    .replaceAll("{veiculo}", os.veiculo)
    .replaceAll("{placa}", os.placa)
    .replaceAll("{numero}", formatOSNumber(os.numero))
    .replaceAll("{status}", statusLabel)
    .replaceAll("{oficina}", workshop.nome);
}

export function renderRetorno(
  cliente: string,
  veiculo: string,
  placa: string,
  workshop: Workshop,
): string {
  const tpl = workshop.mensagem_retorno || DEFAULT_RETORNO;
  return tpl
    .replaceAll("{cliente}", cliente)
    .replaceAll("{veiculo}", veiculo)
    .replaceAll("{placa}", placa)
    .replaceAll("{oficina}", workshop.nome);
}

export const STATUS_LABEL: Record<OSStatus, string> = {
  aguardando_aprovacao: "Aguardando aprovação",
  em_andamento: "Em andamento",
  aguardando_peca: "Aguardando peça",
  concluido: "Concluído",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
