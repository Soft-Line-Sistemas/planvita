import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RelatorioFinanceiroResponse } from "@/services/financeiro/relatorio.service";

type WorkbookJson = Record<string, string | number | null | undefined>;
type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

export const exportRelatorioFinanceiroExcel = (
  relatorio: RelatorioFinanceiroResponse,
  filename = `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`,
) => {
  const workbook = XLSX.utils.book_new();

  const totaisSheet: WorkbookJson[] = [
    {
      Indicador: "Entradas",
      Valor: formatCurrency(relatorio.totais.entradas),
    },
    {
      Indicador: "Saídas",
      Valor: formatCurrency(relatorio.totais.saidas),
    },
    {
      Indicador: "Lucro",
      Valor: formatCurrency(relatorio.totais.lucro),
    },
    {
      Indicador: "Margem (%)",
      Valor: relatorio.totais.margem.toFixed(2),
    },
  ];

  const mensalSheet = relatorio.mensal.map((item) => ({
    Mês: item.mes,
    Entradas: formatCurrency(item.entradas),
    Saídas: formatCurrency(item.saidas),
  }));

  const distribuicaoSheet = relatorio.distribuicao.map((item) => ({
    Categoria: item.nome,
    Valor: formatCurrency(item.valor),
  }));

  const comissoesSheet = relatorio.comissoes.map((item) => ({
    Consultor: item.nome,
    Vendas: formatCurrency(item.vendas),
    Comissão: formatCurrency(item.comissao),
  }));

  const recibosSheet = relatorio.recibos.map((item) => ({
    Indicador: item.tipo,
    Total: item.total,
  }));

  const appendSheet = (data: WorkbookJson[], title: string) => {
    const sheet = XLSX.utils.json_to_sheet(
      data.length ? data : [{ Informação: "Sem dados" }],
    );
    XLSX.utils.book_append_sheet(workbook, sheet, title);
  };

  appendSheet(totaisSheet, "Totais");
  appendSheet(mensalSheet, "Mensal");
  appendSheet(distribuicaoSheet, "Categorias");
  appendSheet(comissoesSheet, "Comissões");
  appendSheet(recibosSheet, "Recibos");

  XLSX.writeFile(workbook, filename);
};

export const exportRelatorioFinanceiroPdf = (
  relatorio: RelatorioFinanceiroResponse,
  filename = `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.pdf`,
) => {
  const doc = new jsPDF({ orientation: "landscape" }) as JsPDFWithAutoTable;
  doc.setFontSize(16);
  doc.text("Relatório Financeiro", 14, 20);
  doc.setFontSize(10);
  doc.text(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);

  autoTable(doc, {
    startY: 36,
    head: [["Indicador", "Valor"]],
    body: [
      ["Entradas", formatCurrency(relatorio.totais.entradas)],
      ["Saídas", formatCurrency(relatorio.totais.saidas)],
      ["Lucro", formatCurrency(relatorio.totais.lucro)],
      ["Margem", `${relatorio.totais.margem.toFixed(2)}%`],
    ],
  });

  const afterTotais = doc.lastAutoTable?.finalY ?? 50;
  autoTable(doc, {
    startY: afterTotais + 10,
    head: [["Mês", "Entradas", "Saídas"]],
    body: relatorio.mensal.map((item) => [
      item.mes,
      formatCurrency(item.entradas),
      formatCurrency(item.saidas),
    ]),
  });

  const afterMensal = doc.lastAutoTable?.finalY ?? afterTotais + 40;
  autoTable(doc, {
    startY: afterMensal + 10,
    head: [["Categoria", "Valor"]],
    body: relatorio.distribuicao.map((item) => [
      item.nome,
      formatCurrency(item.valor),
    ]),
  });

  doc.save(filename);
};
