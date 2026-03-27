import api from "@/utils/api";
import { Cliente } from "@/types/ClientType";
import {
  MetodoPagamento,
  Pagamento,
  StatusPagamento,
} from "@/types/PaymentType";
import { calculateAgeFromBirthDate, toISODateSafe } from "@/utils/date";

type DependenteApi = {
  id: number;
  nome: string;
  cpf?: string | null;
  dataNascimento?: string | null;
  tipoDependente?: string | null;
  parentescoNormalizado?: string | null;
  foraGradeFamiliar?: boolean | null;
  excluirCobrancaAdicional?: boolean | null;
  valorAdicionalMensal?: number | null;
};

type PagamentoApi = {
  id: number;
  valor: number | null;
  dataPagamento: string | null;
  dataVencimento?: string | null;
  status: string | null;
  metodoPagamento: string | null;
  asaasPaymentId?: string | null;
  asaasSubscriptionId?: string | null;
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
  vigenciaMeses?: number | null;
  coberturas?: PlanoCoberturaApi[];
};

type TitularApi = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  dataNascimento?: string | null;
  situacaoConjugal?: string | null;
  profissao?: string | null;
  sexo?: string | null;
  rg?: string | null;
  naturalidade?: string | null;
  statusPlano?: string | null;
  dataContratacao?: string | null;
  cep?: string | null;
  uf?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  pontoReferencia?: string | null;
  dependentes?: DependenteApi[];
  corresponsaveis?: Array<{
    id: number;
    nome: string;
    email: string;
    telefone?: string | null;
    relacionamento: string;
    situacaoConjugal?: string | null;
    profissao?: string | null;
    sexo?: string | null;
    naturalidade?: string | null;
    cep?: string | null;
    uf?: string | null;
    cidade?: string | null;
    bairro?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    pontoReferencia?: string | null;
  }> | null;
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
  return toISODateSafe(value);
};

const calcularIdade = (value?: string | null): number => {
  if (!value) return 0;
  const idade = calculateAgeFromBirthDate(value);
  return idade ?? 0;
};

const normalizarStatusPagamento = (value?: string | null): StatusPagamento => {
  const upper = (value ?? "PENDENTE").toUpperCase();
  const permitidos: StatusPagamento[] = [
    "PENDENTE",
    "PAGO",
    "RECEBIDO",
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
    dataVencimento: pagamento.dataVencimento
      ? toISODate(pagamento.dataVencimento)
      : pagamento.dataPagamento
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
    asaasPaymentId: pagamento.asaasPaymentId ?? undefined,
    asaasSubscriptionId: pagamento.asaasSubscriptionId ?? undefined,
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
    situacaoConjugal: payload.situacaoConjugal ?? "",
    profissao: payload.profissao ?? "",
    sexo: payload.sexo ?? "",
    rg: payload.rg ?? "",
    naturalidade: payload.naturalidade ?? "",
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
      pontoReferencia: payload.pontoReferencia ?? "",
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
      vigenciaMeses: Number(payload.plano?.vigenciaMeses ?? 0) || undefined,
      coberturas: mapPlanoCoberturas(payload.plano),
    },
    consultor: {
      nome: payload.vendedor?.nome ?? "Não informado",
      codigo: payload.vendedor ? `CONS-${payload.vendedor.id}` : "CONS-000",
      email: payload.vendedor?.email ?? "",
      telefone: payload.vendedor?.telefone ?? "",
    },
    responsavelFinanceiro:
      Array.isArray(payload.corresponsaveis) &&
      payload.corresponsaveis.length > 0
        ? {
            id: String(payload.corresponsaveis[0].id),
            nome: payload.corresponsaveis[0].nome ?? "",
            email: payload.corresponsaveis[0].email ?? "",
            telefone: payload.corresponsaveis[0].telefone ?? "",
            relacionamento: payload.corresponsaveis[0].relacionamento ?? "",
            situacaoConjugal: payload.corresponsaveis[0].situacaoConjugal ?? "",
            profissao: payload.corresponsaveis[0].profissao ?? "",
            sexo: payload.corresponsaveis[0].sexo ?? "",
            naturalidade: payload.corresponsaveis[0].naturalidade ?? "",
            cep: payload.corresponsaveis[0].cep ?? "",
            uf: payload.corresponsaveis[0].uf ?? "",
            cidade: payload.corresponsaveis[0].cidade ?? "",
            bairro: payload.corresponsaveis[0].bairro ?? "",
            logradouro: payload.corresponsaveis[0].logradouro ?? "",
            numero: payload.corresponsaveis[0].numero ?? "",
            complemento: payload.corresponsaveis[0].complemento ?? "",
            pontoReferencia: payload.corresponsaveis[0].pontoReferencia ?? "",
          }
        : undefined,
    dependentes: (payload.dependentes ?? []).map((dep) => ({
      id: String(dep.id),
      nome: dep.nome,
      cpf: dep.cpf ?? "",
      dataNascimento: toISODate(dep.dataNascimento),
      idade: calcularIdade(dep.dataNascimento),
      parentesco: dep.tipoDependente ?? "Outro",
      parentescoNormalizado: dep.parentescoNormalizado ?? undefined,
      foraGradeFamiliar: Boolean(dep.foraGradeFamiliar ?? false),
      excluirCobrancaAdicional: Boolean(dep.excluirCobrancaAdicional ?? false),
      valorAdicionalMensal: Number(dep.valorAdicionalMensal ?? 0),
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
      asaasPaymentId: pagamento.asaasPaymentId,
      asaasSubscriptionId: pagamento.asaasSubscriptionId,
    })),
  };
};

export const fetchClienteById = async (
  id: string | number,
): Promise<Cliente> => {
  const { data } = await api.get<TitularApi>(`/titular/${id}`);
  return mapClienteFromApi(data);
};

export type UpdateClientePayload = {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  situacaoConjugal?: string;
  profissao?: string;
  sexo?: string;
  rg?: string;
  naturalidade?: string;
  cep?: string;
  uf?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  pontoReferencia?: string;
  statusPlano?: string;
};

export const atualizarCliente = async (
  id: string | number,
  payload: UpdateClientePayload,
) => {
  const { data } = await api.put(`/titular/${id}`, payload);
  return data;
};

export const atualizarPlanoDoCliente = async (
  titularId: string | number,
  planoId: number | null,
) => {
  const { data } = await api.patch(`/plano/titulares/${titularId}/plano`, {
    planoId,
  });
  return data;
};

export type UpdateCorresponsavelPayload = {
  titularId?: string | number;
  nome?: string;
  email?: string;
  telefone?: string;
  relacionamento?: string;
  situacaoConjugal?: string;
  profissao?: string;
  sexo?: string;
  naturalidade?: string;
  cep?: string;
  uf?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  pontoReferencia?: string;
};

export const atualizarCorresponsavel = async (
  id: string | number,
  payload: UpdateCorresponsavelPayload,
) => {
  const { data } = await api.put(`/corresponsavel/${id}`, payload);
  return data;
};

export const criarCorresponsavel = async (
  payload: UpdateCorresponsavelPayload,
) => {
  const { data } = await api.post(`/corresponsavel`, payload);
  return data;
};
