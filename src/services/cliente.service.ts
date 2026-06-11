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
  carenciaInicioEm?: string | null;
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
  carenciaDias?: number | null;
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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const calculateRemainingCarencia = (
  carenciaDias: number,
  referenceDate?: string | null,
): number => {
  if (!Number.isFinite(carenciaDias) || carenciaDias <= 0) return 0;
  if (!referenceDate) return carenciaDias;

  const startDate = new Date(referenceDate);
  if (Number.isNaN(startDate.getTime())) return carenciaDias;
  startDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - startDate.getTime();
  const elapsedDays = diffMs <= 0 ? 0 : Math.floor(diffMs / MS_PER_DAY);

  return Math.max(0, carenciaDias - elapsedDays);
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
  if (!plan?.coberturas) return [];

  return plan.coberturas.map((cobertura) => ({
    id: cobertura.id,
    tipo: cobertura.tipo,
    descricao: cobertura.descricao ?? "Cobertura do plano",
  }));
};

export const mapClienteFromApi = (payload: TitularApi): Cliente => {
  const dataContratacao =
    toISODate(payload.dataContratacao) ||
    new Date().toISOString().split("T")[0];
  const carenciaDiasPlano = Number(payload.plano?.carenciaDias ?? 0);
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
    carenciaRestante: calculateRemainingCarencia(
      carenciaDiasPlano,
      dataContratacao,
    ),
    diaVencimento: Number.isNaN(diaVencimento) ? 1 : diaVencimento,
    plano: {
      id: payload.plano ? String(payload.plano.id) : "",
      nome: payload.plano?.nome ?? "Plano não informado",
      valorMensal: Number(payload.plano?.valorMensal ?? 0),
      idadeMaxima: null,
      coberturaMaxima: 0,
      carenciaDias: carenciaDiasPlano,
      vigenciaMeses: Number(payload.plano?.vigenciaMeses ?? 0),
      ativo: false,
      totalClientes: 0,
      receitaMensal: 0,
      assistenciaFuneral: 0,
      auxilioCemiterio: null,
      taxaInclusaCemiterioPublico: false,
      beneficios: [],
      coberturas: mapPlanoCoberturas(payload.plano),
      beneficiarios: [],
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
      telefone: "",
      cpf: dep.cpf ?? "",
      dataNascimento: toISODate(dep.dataNascimento),
      carenciaInicioEm: dep.carenciaInicioEm ?? dataContratacao,
      idade: calcularIdade(dep.dataNascimento),
      parentesco: dep.tipoDependente ?? "Outro",
      parentescoNormalizado: dep.parentescoNormalizado ?? undefined,
      foraGradeFamiliar: Boolean(dep.foraGradeFamiliar ?? false),
      excluirCobrancaAdicional: Boolean(dep.excluirCobrancaAdicional ?? false),
      valorAdicionalMensal: Number(dep.valorAdicionalMensal ?? 0),
      carenciaDias: carenciaDiasPlano,
      carenciaRestante: calculateRemainingCarencia(
        carenciaDiasPlano,
        dep.carenciaInicioEm ?? dataContratacao,
      ),
    })),
    pagamentos: mapPagamentos(payload).map((pagamento) => ({
      id: pagamento.id,
      cliente: pagamento.cliente,
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
