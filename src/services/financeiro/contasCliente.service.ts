import api from "@/utils/api";

export type ContaFinanceira = {
  paymentUrl: string | null;
  pixQrCode: string | null;
  id: number;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  tipo: "Pagar" | "Receber";
  asaasPaymentId?: string | null;
  asaasSubscriptionId?: string | null;
};

type ContaFinanceiraApiPayload = {
  id?: number | string;
  descricao?: string | null;
  valor?: number | string | null;
  vencimento?: string | null;
  status?: string | null;
  tipo?: "Pagar" | "Receber" | string | null;
  paymentUrl?: string | null;
  pixQrCode?: string | null;
  asaasPaymentId?: string | null;
  asaasSubscriptionId?: string | null;
};

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeStatus(status?: string | null): string {
  const s = String(status ?? "PENDENTE").toUpperCase();
  if (s === "CONFIRMADO") return "RECEBIDO";
  if (s === "PENDING") return "PENDENTE";
  if (s === "OVERDUE") return "ATRASADO";
  return s;
}

function mapConta(item: ContaFinanceiraApiPayload): ContaFinanceira {
  return {
    id: Number(item.id ?? 0),
    descricao: item.descricao ?? "—",
    valor: toNumber(item.valor),
    vencimento: item.vencimento ?? "",
    status: normalizeStatus(item.status),
    tipo: item.tipo === "Pagar" ? "Pagar" : "Receber",
    paymentUrl: item.paymentUrl ?? null,
    pixQrCode: item.pixQrCode ?? null,
    asaasPaymentId: item.asaasPaymentId ?? null,
    asaasSubscriptionId: item.asaasSubscriptionId ?? null,
  };
}

function extractContasArray(data: unknown): ContaFinanceiraApiPayload[] {
  if (Array.isArray(data)) return data as ContaFinanceiraApiPayload[];
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.contas))
    return obj.contas as ContaFinanceiraApiPayload[];
  if (Array.isArray(obj.data)) return obj.data as ContaFinanceiraApiPayload[];
  if (
    obj.result &&
    typeof obj.result === "object" &&
    Array.isArray((obj.result as Record<string, unknown>).contas)
  ) {
    return (obj.result as { contas: ContaFinanceiraApiPayload[] }).contas;
  }
  return [];
}

export const listarContasDoCliente = async (): Promise<ContaFinanceira[]> => {
  const { data } = await api.get("/financeiro/cliente/contas");
  const debug =
    typeof window !== "undefined" && process.env.NODE_ENV !== "production";
  if (debug) {
  }
  const contasRaw = extractContasArray(data);
  const contas = contasRaw.map(mapConta);
  return contas;
};
