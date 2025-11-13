import api from "@/utils/api";
import { Cliente } from "@/types/ClientType";
import {
  MetodoPagamento,
  Pagamento,
  StatusPagamento,
} from "@/types/PaymentType";

type DependenteApi = {
  id: number;
  nome: string;
  cpf?: string | null;
  dataNascimento?: string | null;
  tipoDependente?: string | null;
};

type PagamentoApi = {
  id: number;
  valor: number | null;
  dataPagamento: string | null;
  status: string | null;
  metodoPagamento: string | null;
};

type PlanoCoberturaApi = {
  id: number;
  tipo: string;
  descricao: string | null;
};

type PlanoApi = {
  id: number;
  nome: string;
  valorMensal: number;
  coberturas?: PlanoCoberturaApi[];
};

type TitularApi = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  dataNascimento?: string | null;
  statusPlano?: string | null;
  dataContratacao?: string | null;
  cep?: string | null;
  uf?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  dependentes?: DependenteApi[];
  plano?: PlanoApi | null;
  pagamentos?: PagamentoApi[];
  vendedor?: {
    nome?: string | null;
    email?: string | null;
    telefone?: string | null;
    id: number;
  } | null;
};

const toISODate = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const calcularIdade = (value?: string | null): number => {
  if (!value) return 0;
  const nascimento = new Date(value);
  if (Number.isNaN(nascimento.getTime())) return 0;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
};

const normalizarStatusPagamento = (value?: string | null): StatusPagamento => {
  const upper = (value ?? "PENDENTE").toUpperCase();
  const permitidos: StatusPagamento[] = [
    "PENDENTE",
    "PAGO",
    "VENCIDO",
    "CANCELADO",
  ];
  return permitidos.includes(upper as StatusPagamento)
    ? (upper as StatusPagamento)
    : "PENDENTE";
};

const normalizarMetodoPagamento = (value?: string | null): MetodoPagamento => {
  if (!value) return "Boleto";
  const normalized = value.toLowerCase();
  if (normalized.includes("pix")) return "PIX";
  if (normalized.includes("cart")) return "Cartão de Crédito";
  return "Boleto";
};

const mapPagamentos = (titular: TitularApi): Pagamento[] => {
  if (!Array.isArray(titular.pagamentos)) return [];

  return titular.pagamentos.map((pagamento) => ({
    id: String(pagamento.id),
    cliente: {
      id: String(titular.id),
      nome: titular.nome,
      email: titular.email,
      telefone: titular.telefone ?? "",
      cpf: titular.cpf ?? "",
      plano: titular.plano?.nome ?? "—",
    },
    valor: Number(pagamento.valor ?? 0),
    dataVencimento: pagamento.dataPagamento
      ? toISODate(pagamento.dataPagamento)
      : new Date().toISOString().split("T")[0],
    dataPagamento: pagamento.dataPagamento
      ? toISODate(pagamento.dataPagamento)
      : null,
    status: normalizarStatusPagamento(pagamento.status),
    metodoPagamento: normalizarMetodoPagamento(pagamento.metodoPagamento),
    referencia: `PG-${String(pagamento.id).padStart(4, "0")}`,
    diasAtraso: 0,
    observacoes: "",
  }));
};

const mapPlanoCoberturas = (plan?: PlanoApi | null) => {
  const base = {
    servicosPadrao: [] as { nome: string; descricao: string }[],
    coberturaTranslado: [] as { nome: string; descricao: string }[],
    servicosEspecificos: [] as { nome: string; descricao: string }[],
  };

  if (!plan?.coberturas) return base;

  plan.coberturas.forEach((cobertura) => {
    const target = cobertura.tipo?.toLowerCase() ?? "";
    const descricao = cobertura.descricao ?? "Cobertura do plano";
    const entry = {
      nome: cobertura.tipo,
      descricao,
    };

    if (target.includes("translado")) {
      base.coberturaTranslado.push(entry);
    } else if (target.includes("especific") || target.includes("servico")) {
      base.servicosEspecificos.push(entry);
    } else {
      base.servicosPadrao.push(entry);
    }
  });

  return base;
};

export const mapClienteFromApi = (payload: TitularApi): Cliente => {
  const dataContratacao =
    toISODate(payload.dataContratacao) ||
    new Date().toISOString().split("T")[0];
  const diaVencimento = dataContratacao
    ? Number(dataContratacao.split("-")[2])
    : 1;

  return {
    id: String(payload.id),
    nome: payload.nome,
    cpf: payload.cpf ?? "",
    email: payload.email ?? "",
    telefone: payload.telefone ?? "",
    whatsapp: payload.telefone ?? "",
    dataNascimento: toISODate(payload.dataNascimento),
    idade: calcularIdade(payload.dataNascimento),
    endereco: {
      cep: payload.cep ?? "",
      uf: payload.uf ?? "",
      cidade: payload.cidade ?? "",
      bairro: payload.bairro ?? "",
      logradouro: payload.logradouro ?? "",
      numero: payload.numero ?? "",
      complemento: payload.complemento ?? "",
    },
    statusPlano: payload.statusPlano ?? "ATIVO",
    dataContratacao,
    dataCarencia: dataContratacao,
    carenciaRestante: 0,
    diaVencimento: Number.isNaN(diaVencimento) ? 1 : diaVencimento,
    plano: {
      id: payload.plano ? String(payload.plano.id) : "",
      nome: payload.plano?.nome ?? "Plano não informado",
      valorMensal: Number(payload.plano?.valorMensal ?? 0),
      coberturas: mapPlanoCoberturas(payload.plano),
    },
    consultor: {
      nome: payload.vendedor?.nome ?? "Não informado",
      codigo: payload.vendedor ? `CONS-${payload.vendedor.id}` : "CONS-000",
      email: payload.vendedor?.email ?? "",
      telefone: payload.vendedor?.telefone ?? "",
    },
    dependentes: (payload.dependentes ?? []).map((dep) => ({
      id: String(dep.id),
      nome: dep.nome,
      cpf: dep.cpf ?? "",
      dataNascimento: toISODate(dep.dataNascimento),
      idade: calcularIdade(dep.dataNascimento),
      parentesco: dep.tipoDependente ?? "Outro",
      carenciaRestante: 0,
    })),
    pagamentos: mapPagamentos(payload).map((pagamento) => ({
      id: pagamento.id,
      valor: pagamento.valor,
      dataVencimento: pagamento.dataVencimento,
      dataPagamento: pagamento.dataPagamento,
      status: pagamento.status,
      metodoPagamento: pagamento.metodoPagamento,
      diasAtraso: pagamento.diasAtraso,
      referencia: pagamento.referencia,
      observacoes: pagamento.observacoes,
    })),
  };
};

export const fetchClienteById = async (
  id: string | number,
): Promise<Cliente> => {
  const { data } = await api.get<TitularApi>(`/titular/${id}`);
  return mapClienteFromApi(data);
};
