import api from "@/utils/api";
import {
  ContaFinanceira,
  RecorrenciaFinanceira,
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

type RecorrenciaFinanceiraApi = {
  asaasSubscriptionId: string;
  clienteId: number | null;
  clienteNome?: string | null;
  statusAtual?: string | null;
  valorAtual?: number | null;
  proximoVencimento?: string | null;
  ultimaLiquidacao?: string | null;
  aberto?: boolean;
  totalPagas?: number;
};

const normalizarStatus = (valor?: string | null): StatusFinanceiro => {
  const upper = (valor ?? "PENDENTE").toUpperCase();
  if (upper === "OVERDUE") return "VENCIDO";
  const aceitos: StatusFinanceiro[] = [
    "PENDENTE",
    "CONFIRMADO",
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

const mapRecorrencia = (
  payload: RecorrenciaFinanceiraApi,
): RecorrenciaFinanceira => ({
  asaasSubscriptionId: payload.asaasSubscriptionId,
  clienteId: payload.clienteId ?? null,
  clienteNome: payload.clienteNome ?? "Cliente não informado",
  statusAtual: (payload.statusAtual ?? "PENDENTE").toUpperCase(),
  valorAtual: Number(payload.valorAtual ?? 0),
  proximoVencimento: payload.proximoVencimento ?? null,
  ultimaLiquidacao: payload.ultimaLiquidacao ?? null,
  aberto: Boolean(payload.aberto ?? false),
  totalPagas: Number(payload.totalPagas ?? 0),
});

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
  billingType?: "PIX" | "BOLETO" | "CREDIT_CARD";
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

export const fetchRecorrenciasFinanceiras = async (): Promise<
  RecorrenciaFinanceira[]
> => {
  const { data } = await api.get<RecorrenciaFinanceiraApi[]>(
    "/financeiro/recorrencias",
  );
  if (!Array.isArray(data)) return [];
  return data.map(mapRecorrencia);
};

export const sincronizarRecorrenciasFinanceiras = async () => {
  const { data } = await api.post("/financeiro/recorrencias/sincronizar");
  return data as { processed: number; inserted: number; updated: number };
};

export type AtualizarContaPagarPayload = Partial<NovaContaPagarPayload>;
export type AtualizarContaReceberPayload = Partial<NovaContaReceberPayload>;

export const atualizarContaFinanceira = async (
  tipo: TipoConta,
  id: number | string,
  payload: AtualizarContaPagarPayload | AtualizarContaReceberPayload,
) => {
  const endpoint = tipo === "Pagar" ? "pagar" : "receber";
  const { data } = await api.put<ContaFinanceiraApi>(
    `/financeiro/contas/${endpoint}/${id}`,
    payload,
  );
  return mapContaFinanceira(data);
};

export const deleteContaFinanceira = async (
  tipo: TipoConta,
  id: number | string,
) => {
  const endpoint = tipo === "Pagar" ? "pagar" : "receber";
  await api.delete(`/financeiro/contas/${endpoint}/${id}`);
  return true;
};
