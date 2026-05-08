import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBRL, formatDate, formatOSNumber, formatPhone } from "./format";

export type OSForPDF = {
  numero: number;
  criada_em: string;
  previsao_entrega?: string | null;
  observacoes?: string | null;
  forma_pagamento?: string | null;
  km_entrada?: number | null;
  cliente: { nome: string; telefone?: string | null; email?: string | null };
  veiculo: {
    placa: string;
    marca?: string | null;
    modelo?: string | null;
    ano?: number | null;
    cor?: string | null;
  };
  servicos: { descricao: string; valor: number }[];
  pecas: { nome: string; quantidade: number; valor_unitario: number; valor_total: number }[];
  total_servicos: number;
  total_pecas: number;
  total_geral: number;
};

export type WorkshopForPDF = {
  nome: string;
  telefone?: string | null;
  endereco?: string | null;
  logo_url?: string | null;
};

export function gerarOrcamentoPDF(os: OSForPDF, workshop: WorkshopForPDF): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  // Cabeçalho oficina
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(workshop.nome, margin, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  y += 5;
  if (workshop.telefone) {
    doc.text(`Tel: ${formatPhone(workshop.telefone)}`, margin, y);
    y += 4;
  }
  if (workshop.endereco) {
    doc.text(workshop.endereco, margin, y);
    y += 4;
  }

  // Título
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`ORÇAMENTO ${formatOSNumber(os.numero)}`, pageW - margin, 16, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Emitido: ${formatDate(os.criada_em)}`, pageW - margin, 22, { align: "right" });
  if (os.previsao_entrega) {
    doc.text(`Previsão: ${formatDate(os.previsao_entrega)}`, pageW - margin, 27, {
      align: "right",
    });
  }

  y = Math.max(y, 32);
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Cliente + veículo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CLIENTE", margin, y);
  doc.text("VEÍCULO", pageW / 2, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.text(os.cliente.nome, margin, y);
  doc.text(
    `${os.veiculo.marca ?? ""} ${os.veiculo.modelo ?? ""}`.trim() || "—",
    pageW / 2,
    y
  );
  y += 4;
  if (os.cliente.telefone) doc.text(formatPhone(os.cliente.telefone), margin, y);
  doc.text(`Placa: ${os.veiculo.placa}`, pageW / 2, y);
  y += 4;
  if (os.cliente.email) doc.text(os.cliente.email, margin, y);
  const v2 = [
    os.veiculo.ano ? `${os.veiculo.ano}` : "",
    os.veiculo.cor ?? "",
    os.km_entrada ? `${os.km_entrada} km` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (v2) doc.text(v2, pageW / 2, y);
  y += 6;

  // Serviços
  if (os.servicos.length) {
    autoTable(doc, {
      startY: y,
      head: [["Serviço", "Valor"]],
      body: os.servicos.map((s) => [s.descricao, formatBRL(s.valor)]),
      headStyles: { fillColor: [30, 30, 30] },
      columnStyles: { 1: { halign: "right", cellWidth: 35 } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
    });
    // @ts-expect-error - lastAutoTable injected by autoTable
    y = doc.lastAutoTable.finalY + 4;
  }

  // Peças
  if (os.pecas.length) {
    autoTable(doc, {
      startY: y,
      head: [["Peça", "Qtd", "Unit.", "Total"]],
      body: os.pecas.map((p) => [
        p.nome,
        String(p.quantidade),
        formatBRL(p.valor_unitario),
        formatBRL(p.valor_total),
      ]),
      headStyles: { fillColor: [30, 30, 30] },
      columnStyles: {
        1: { halign: "center", cellWidth: 18 },
        2: { halign: "right", cellWidth: 28 },
        3: { halign: "right", cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
    });
    // @ts-expect-error - lastAutoTable injected by autoTable
    y = doc.lastAutoTable.finalY + 4;
  }

  // Totais
  const boxX = pageW - margin - 70;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Mão de obra:", boxX, y);
  doc.text(formatBRL(os.total_servicos), pageW - margin, y, { align: "right" });
  y += 5;
  doc.text("Peças:", boxX, y);
  doc.text(formatBRL(os.total_pecas), pageW - margin, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", boxX, y);
  doc.text(formatBRL(os.total_geral), pageW - margin, y, { align: "right" });
  y += 8;

  if (os.forma_pagamento) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Forma de pagamento: ${os.forma_pagamento.replace("_", " ")}`,
      margin,
      y
    );
    y += 5;
  }

  if (os.observacoes) {
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(os.observacoes, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 4;
  }

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Orçamento válido por 7 dias. Os valores podem ser ajustados após avaliação técnica.",
    margin,
    285
  );

  return doc;
}

export function baixarOrcamentoPDF(os: OSForPDF, workshop: WorkshopForPDF) {
  const doc = gerarOrcamentoPDF(os, workshop);
  doc.save(`orcamento-${formatOSNumber(os.numero)}.pdf`);
}
