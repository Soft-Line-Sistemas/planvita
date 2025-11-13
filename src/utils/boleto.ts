import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Pagamento } from "@/types/PaymentType";

const formatCurrency = (valor: number) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const formatDate = (valor: string | null) =>
  valor
    ? new Date(valor).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

export const gerarBoletoPDF = (pagamento: Pagamento) => {
  const doc = new jsPDF();
  const referencia = pagamento.referencia || `PG-${pagamento.id}`;

  doc.setFontSize(16);
  doc.text("Boleto Bancário", 14, 20);
  doc.setFontSize(11);
  doc.text(`Referência: ${referencia}`, 14, 30);
  doc.text(`Cliente: ${pagamento.cliente.nome}`, 14, 38);
  doc.text(`CPF: ${pagamento.cliente.cpf}`, 14, 46);
  doc.text(`Email: ${pagamento.cliente.email}`, 14, 54);

  autoTable(doc, {
    startY: 64,
    head: [["Descrição", "Valor"]],
    body: [["Valor do Boleto", formatCurrency(pagamento.valor)]],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 6 : 90,
    head: [["Campo", "Informação"]],
    body: [
      ["Data de Vencimento", formatDate(pagamento.dataVencimento)],
      ["Método de Pagamento", pagamento.metodoPagamento],
      ["Status", pagamento.status],
    ],
  });

  doc.setFontSize(10);
  doc.text(
    "Documento gerado automaticamente para fins de cobrança.",
    14,
    (doc.lastAutoTable?.finalY ?? 120) + 10,
  );

  doc.save(`boleto-${referencia}.pdf`);
};
