import api from "@/utils/api";
import {
  Pagamento,
  StatusPagamento,
  MetodoPagamento,
} from "@/types/PaymentType";

export type PagamentoApi = {
  asaasSubscriptionId: undefined;
  asaasPaymentId: undefined;
  id: number;
  titularId: number | null;
  valor: number | null;
  dataPagamento: string | null;
  status: string | null;
  metodoPagamento: string | null;
  titular?: {
    id: number;
    nome?: string | null;
    email?: string | null;
    telefone?: string | null;
    cpf?: string | null;
    plano?: {
      id: number;
      nome?: string | null;
    } | null;
  } | null;
};

const STATUS_PERMITIDOS: StatusPagamento[] = [
  "PAGO",
  "RECEBIDO",
  "PENDENTE",
  "VENCIDO",
  "CANCELADO",
];

const METODOS_PERMITIDOS: MetodoPagamento[] = [
  "Boleto",
  "PIX",
  "Cartão de Crédito",
];

const normalizarStatus = (valor?: string | null): StatusPagamento => {
  const upper = (valor ?? "").toUpperCase();
  const encontrado = STATUS_PERMITIDOS.find((status) => status === upper);
  return encontrado ?? "PENDENTE";
};

const normalizarMetodo = (valor?: string | null): MetodoPagamento => {
  if (!valor) return "Boleto";
  const normalizado = valor
    .toLowerCase()
    .replace("cartao", "cartão")
    .replace("credito", "crédito");

  const encontrado = METODOS_PERMITIDOS.find((metodo) =>
    metodo.toLowerCase().includes(normalizado),
  );

  if (encontrado) return encontrado;

  if (valor.toLowerCase().includes("pix")) return "PIX";
  if (valor.toLowerCase().includes("cart")) return "Cartão de Crédito";

  return "Boleto";
};

const calcularDiasAtraso = (dataVencimento?: string | null): number => {
  if (!dataVencimento) return 0;
  const vencimento = new Date(dataVencimento);
  if (Number.isNaN(vencimento.getTime())) return 0;

  const hoje = new Date();
  const diffMs = hoje.getTime() - vencimento.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDias > 0 ? diffDias : 0;
};

const gerarReferencia = (id: number | null | undefined) => {
  if (!id || id <= 0) return "PG-0000";
  return `PG-${String(id).padStart(4, "0")}`;
};

export const mapPagamentoFromApi = (payload: PagamentoApi): Pagamento => {
  const status = normalizarStatus(payload.status);
  const metodoPagamento = normalizarMetodo(payload.metodoPagamento);
  const dataVencimento = payload.dataPagamento ?? new Date().toISOString();
  const clienteTitular = payload.titular;

  return {
    id: String(payload.id ?? payload.titularId ?? Date.now()),
    cliente: {
      id: String(clienteTitular?.id ?? payload.titularId ?? payload.id ?? 0),
      nome: clienteTitular?.nome ?? "Cliente não identificado",
      email: clienteTitular?.email ?? "sem-email@planvita.com",
      telefone: clienteTitular?.telefone ?? "—",
      cpf: clienteTitular?.cpf ?? "—",
      plano: clienteTitular?.plano?.nome ?? "Plano não informado",
    },
    valor: Number(payload.valor ?? 0),
    dataVencimento,
    dataPagamento:
      status === "PAGO" || status === "RECEBIDO" ? payload.dataPagamento : null,
    status,
    metodoPagamento,
    referencia: gerarReferencia(payload.id),
    diasAtraso:
      status === "PENDENTE" || status === "VENCIDO"
        ? calcularDiasAtraso(dataVencimento)
        : 0,
    observacoes: "",
    asaasPaymentId: payload.asaasPaymentId ?? undefined,
    asaasSubscriptionId: payload.asaasSubscriptionId ?? undefined,
  };
};

export const listarPagamentos = async (): Promise<Pagamento[]> => {
  const { data } = await api.get<PagamentoApi[]>("/pagamento");
  if (!Array.isArray(data)) return [];
  return data.map(mapPagamentoFromApi);
};

export const atualizarStatusPagamento = async (
  id: number | string,
  payload: Partial<Pick<PagamentoApi, "status" | "dataPagamento">>,
) => {
  const { data } = await api.put<PagamentoApi>(`/pagamento/${id}`, payload);
  return mapPagamentoFromApi(data);
};
