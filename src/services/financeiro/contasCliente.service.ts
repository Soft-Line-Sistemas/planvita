import api from "@/utils/api";

export type ContaFinanceira = {
  id: number;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  tipo: "Pagar" | "Receber";
  paymentUrl?: string | null;
  asaasPaymentId?: string | null;
  invoiceUrl?: string | null;
};

export const listarContasDoCliente = async (
  clienteId: number | string,
): Promise<ContaFinanceira[]> => {
  const { data } = await api.get("/financeiro/contas");
  if (!Array.isArray(data)) return [];
  const idNumber = Number(clienteId);
  return data
    .filter(
      (conta) =>
        conta.tipo === "Receber" &&
        conta.clienteId &&
        Number(conta.clienteId) === idNumber,
    )
    .map((conta) => ({
      id: conta.id,
      descricao: conta.descricao ?? "—",
      valor: Number(conta.valor ?? 0),
      vencimento: conta.vencimento,
      status: conta.status ?? "PENDENTE",
      tipo: conta.tipo,
      paymentUrl: conta.paymentUrl,
      asaasPaymentId: conta.asaasPaymentId,
      invoiceUrl: conta.invoiceUrl,
    }));
};
