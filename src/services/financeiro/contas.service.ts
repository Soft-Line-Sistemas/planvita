import api from "@/utils/api";
import {
  ContaFinanceira,
  StatusFinanceiro,
  TipoConta,
} from "@/types/Financeiro";

type ContaFinanceiraApi = {
  id: number;
  tipo: TipoConta;
  descricao?: string | null;
  valor?: number | null;
  vencimento: string;
  status?: string | null;
  fornecedor?: string | null;
  clienteId?: number | null;
  cliente?: {
    id: number;
    nome?: string | null;
    email?: string | null;
    telefone?: string | null;
    cpf?: string | null;
  } | null;
  dataPagamento?: string | null;
  dataRecebimento?: string | null;
  observacao?: string | null;
  asaasPaymentId?: string | null;
  asaasSubscriptionId?: string | null;
  paymentUrl?: string | null;
  pixQrCode?: string | null;
  pixExpiration?: string | null;
  metodoPagamento?: string | null;
  dataVencimento?: string | null;
};

const normalizarStatus = (valor?: string | null): StatusFinanceiro => {
  const upper = (valor ?? "PENDENTE").toUpperCase();
  if (upper === "OVERDUE") return "VENCIDO";
  const aceitos: StatusFinanceiro[] = [
    "PENDENTE",
    "PAGO",
    "RECEBIDO",
    "ATRASADO",
    "VENCIDO",
    "CANCELADO",
  ];
  return aceitos.includes(upper as StatusFinanceiro)
    ? (upper as StatusFinanceiro)
    : "PENDENTE";
};

const mapContaFinanceira = (payload: ContaFinanceiraApi): ContaFinanceira => {
  const tipo: TipoConta = payload.tipo === "Receber" ? "Receber" : "Pagar";
  const cliente =
    payload.cliente && tipo === "Receber"
      ? {
          id: payload.cliente.id,
          nome:
            payload.cliente.nome ??
            `Cliente #${payload.cliente.id.toString().padStart(4, "0")}`,
          email: payload.cliente.email ?? null,
          telefone: payload.cliente.telefone ?? null,
          cpf: payload.cliente.cpf ?? null,
        }
      : null;

  return {
    id: payload.id,
    tipo,
    descricao: payload.descricao ?? payload.observacao ?? "—",
    valor: Number(payload.valor ?? 0),
    dataVencimento: payload.dataVencimento ?? payload.vencimento,
    status: normalizarStatus(payload.status),
    parceiro:
      tipo === "Pagar"
        ? (payload.fornecedor ?? "Fornecedor não informado")
        : (cliente?.nome ?? "Cliente não informado"),
    contato:
      tipo === "Pagar"
        ? (payload.fornecedor ?? null)
        : (cliente?.email ?? null),
    clienteId: cliente?.id ?? null,
    cliente,
    dataPagamento: payload.dataPagamento ?? null,
    dataRecebimento: payload.dataRecebimento ?? null,
    observacao: payload.observacao ?? null,
    asaasPaymentId: payload.asaasPaymentId ?? null,
    asaasSubscriptionId: payload.asaasSubscriptionId ?? null,
    paymentUrl: payload.paymentUrl ?? null,
    pixQrCode: payload.pixQrCode ?? null,
    pixExpiration: payload.pixExpiration ?? null,
    metodoPagamento: payload.metodoPagamento ?? null,
  };
};

export const fetchContasFinanceiras = async (): Promise<ContaFinanceira[]> => {
  const { data } = await api.get<ContaFinanceiraApi[]>("/financeiro/contas");
  if (!Array.isArray(data)) return [];
  return data.map(mapContaFinanceira);
};

export const baixarContaFinanceira = async (
  tipo: TipoConta,
  id: number | string,
) => {
  const { data } = await api.post<ContaFinanceiraApi>(
    `/financeiro/contas/${tipo.toLowerCase()}/${id}/baixa`,
  );
  return mapContaFinanceira(data);
};

export const estornarContaFinanceira = async (
  tipo: TipoConta,
  id: number | string,
) => {
  const { data } = await api.post<ContaFinanceiraApi>(
    `/financeiro/contas/${tipo.toLowerCase()}/${id}/estorno`,
  );
  return mapContaFinanceira(data);
};

export type NovaContaPagarPayload = {
  descricao: string;
  valor: number;
  vencimento: string;
  fornecedor?: string;
};

export type NovaContaReceberPayload = {
  descricao: string;
  valor: number;
  vencimento: string;
  clienteId?: number;
  integrarAsaas?: boolean;
  billingType?: string;
};

export const criarContaFinanceira = async (
  tipo: TipoConta,
  payload: NovaContaPagarPayload | NovaContaReceberPayload,
) => {
  const endpoint = tipo === "Pagar" ? "pagar" : "receber";
  const { data } = await api.post<ContaFinanceiraApi>(
    `/financeiro/contas/${endpoint}`,
    payload,
  );
  return mapContaFinanceira(data);
};

export const reconsultarContaReceber = async (id: number | string) => {
  const { data } = await api.post<ContaFinanceiraApi>(
    `/financeiro/contas/receber/${id}/reconsulta`,
  );
  return mapContaFinanceira(data);
};
