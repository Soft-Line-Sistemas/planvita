import api from "@/utils/api";
import type { ClientePlano } from "@/types/ClientePlano";
import { API_VERSION, getApiUrl } from "@/config/api-config";

const normalizeCpf = (value: string) => value.replace(/\D/g, "");

const formatCpf = (value: string) => {
  const digits = normalizeCpf(value);
  if (digits.length !== 11) return value;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const addMonths = (isoDate: string, months: number) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy.toISOString();
};

type PlanoResponse = {
  id?: number | string | null;
  nome?: string | null;
  codigo?: string | null;
  descricao?: string | null;
  valorMensal?: number | null;
  carenciaDias?: number | null;
  vigenciaMeses?: number | null;
  coberturas?: Array<{ descricao?: string | null; tipo?: string | null }>;
};

type TitularResponse = {
  id?: number | null;
  tenantSlug?: string | null;
  nome?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  statusPlano?: string | null;
  dataContratacao?: string | null;
  pagamentoConfirmadoEm?: string | null;
  formaPagamentoAdesao?: string | null;
  asaasCardLast4?: string | null;
  asaasCardBrand?: string | null;
  asaasCardHolderName?: string | null;
  assinaturas?: Array<{
    tipo?: string | null;
    createdAt?: string | null;
  }> | null;
  fotoPerfil?: {
    id?: number | null;
    arquivoUrl?: string | null;
    dataUpload?: string | null;
  } | null;
  plano?: PlanoResponse | null;
  dependentes?: Array<{
    id?: number | string | null;
    nome?: string | null;
    dataNascimento?: string | null;
    carenciaInicioEm?: string | null;
    tipoDependente?: string | null;
    valorAdicionalMensal?: number | null;
  }> | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const ASSINATURAS_OBRIGATORIAS = [
  "TITULAR_ASSINATURA_1",
  "TITULAR_ASSINATURA_2",
  "CORRESPONSAVEL_ASSINATURA_1",
  "CORRESPONSAVEL_ASSINATURA_2",
];

const startOfDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeMetodoPagamento = (
  value?: string | null,
): ClientePlano["metodoPagamentoAtual"] => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (normalized === "CREDIT_CARD" || normalized === "CARTAO") {
    return "CREDIT_CARD";
  }
  if (normalized === "PIX") {
    return "PIX";
  }
  if (normalized === "BOLETO") {
    return "BOLETO";
  }
  return null;
};

const getLatestDate = (...values: Array<string | null | undefined>) => {
  const validValues = values.filter((value): value is string => {
    if (!value) return false;
    return !Number.isNaN(new Date(value).getTime());
  });

  if (!validValues.length) return null;

  return validValues.reduce((latest, current) =>
    new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
  );
};

const calculateRemainingCarencia = (
  carenciaDias: number,
  referenceDate?: string | null,
) => {
  if (!Number.isFinite(carenciaDias) || carenciaDias <= 0) return 0;
  if (!referenceDate) return carenciaDias;

  const startDate = startOfDay(referenceDate);
  if (!startDate) return carenciaDias;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - startDate.getTime();
  const elapsedDays = diffMs <= 0 ? 0 : Math.floor(diffMs / MS_PER_DAY);

  return Math.max(0, carenciaDias - elapsedDays);
};

export const mapTitularToCarteirinha = (
  titular: TitularResponse,
): ClientePlano => {
  const plano = titular?.plano ?? null;
  const cobertura =
    plano?.coberturas?.map(
      (item) => item?.descricao || item?.tipo || "Cobertura incluída",
    ) ?? [];

  const dependentes =
    titular?.dependentes?.map((dep) => {
      const carenciaDias = Number(plano?.carenciaDias ?? 0);
      const carenciaInicioEm =
        dep?.carenciaInicioEm ?? titular?.dataContratacao ?? null;
      const carenciaRestante = calculateRemainingCarencia(
        carenciaDias,
        carenciaInicioEm,
      );

      return {
        id: dep?.id ?? 0,
        nome: dep?.nome ?? "Dependente",
        dataNascimento: dep?.dataNascimento ?? null,
        carenciaInicioEm,
        tipo: dep?.tipoDependente ?? null,
        carenciaDias,
        carenciaRestante,
        valorAdicionalMensal: Number(dep?.valorAdicionalMensal ?? 0),
      };
    }) ?? [];

  const valorMensalBase = Number(plano?.valorMensal ?? 0);
  const valorAdicionalMensal = dependentes.reduce(
    (acc, dep) => acc + Number(dep.valorAdicionalMensal ?? 0),
    0,
  );
  const valorTotalMensal = valorMensalBase + valorAdicionalMensal;

  const numeroCarteirinha = `PV-${String(titular?.id ?? "000000").padStart(
    6,
    "0",
  )}`;

  const statusPlano = String(titular?.statusPlano || "ativo").toLowerCase();
  const statusMapped: ClientePlano["plano"]["status"] =
    statusPlano === "ativo"
      ? "ativo"
      : statusPlano === "pendente_assinatura"
        ? "pendente_assinatura"
        : statusPlano === "suspenso"
          ? "suspenso"
          : "inativo";

  const fotoPerfilQuery = titular?.fotoPerfil?.dataUpload
    ? `?t=${encodeURIComponent(titular.fotoPerfil.dataUpload)}`
    : "";
  const fotoPerfilProxyUrl = titular?.fotoPerfil
    ? `${getApiUrl()}/${API_VERSION}/titular/me/foto/arquivo${fotoPerfilQuery}`
    : null;

  const assinaturas =
    titular?.assinaturas?.map((assinatura) => ({
      tipo: assinatura?.tipo ?? "",
      createdAt: assinatura?.createdAt ?? null,
    })) ?? [];
  const tiposAssinados = new Map(
    assinaturas.map((assinatura) => [assinatura.tipo, assinatura]),
  );
  const assinaturasPendentes = ASSINATURAS_OBRIGATORIAS.some(
    (tipo) => !tiposAssinados.has(tipo),
  );
  const ultimaAssinaturaObrigatoriaEm = assinaturasPendentes
    ? null
    : getLatestDate(
        ...ASSINATURAS_OBRIGATORIAS.map(
          (tipo) => tiposAssinados.get(tipo)?.createdAt ?? null,
        ),
      );
  const ativadoEm =
    titular?.pagamentoConfirmadoEm && ultimaAssinaturaObrigatoriaEm
      ? getLatestDate(
          titular.pagamentoConfirmadoEm,
          ultimaAssinaturaObrigatoriaEm,
        )
      : null;
  const vigenciaInicio =
    ativadoEm ??
    titular?.pagamentoConfirmadoEm ??
    titular?.dataContratacao ??
    new Date().toISOString();
  const vigenciaFim = addMonths(vigenciaInicio, plano?.vigenciaMeses ?? 12);

  const cartaoPagamento = titular?.asaasCardLast4
    ? {
        last4: titular.asaasCardLast4,
        brand: titular.asaasCardBrand ?? "",
        holderName: titular.asaasCardHolderName ?? "",
      }
    : null;
  const metodoPagamentoAtual =
    normalizeMetodoPagamento(titular?.formaPagamentoAdesao) ??
    (cartaoPagamento ? "CREDIT_CARD" : null);

  return {
    titularId: titular?.id ?? null,
    tenantSlug: titular?.tenantSlug ?? null,
    fotoPerfilUrl: fotoPerfilProxyUrl,
    cpf: formatCpf(titular?.cpf ?? ""),
    nome: titular?.nome ?? "Titular não identificado",
    numeroCarteirinha,
    email: titular?.email ?? undefined,
    telefone: titular?.telefone ?? undefined,
    dataContratacao: titular?.dataContratacao ?? null,
    pagamentoConfirmadoEm: titular?.pagamentoConfirmadoEm ?? null,
    assinaturasPendentes,
    assinaturas,
    cartaoPagamento,
    metodoPagamentoAtual,
    plano: {
      id: plano?.id ? String(plano.id) : "plano-indefinido",
      nome: plano?.nome ?? "Plano não informado",
      codigo: plano?.codigo ?? `PLN-${plano?.id ?? "N/D"}`,
      status: statusMapped,
      ativadoEm,
      vigencia: {
        inicio: vigenciaInicio,
        fim: vigenciaFim,
      },
      valorMensal: valorMensalBase,
      carenciaDias: Number(plano?.carenciaDias ?? 0),
      valorAdicionalMensal,
      valorTotalMensal,
      cobertura: cobertura.length
        ? cobertura
        : ["Cobertura padrão do plano contratado."],
      observacoes: plano?.descricao ?? undefined,
    },
    dependentes,
  };
};

export const consultarClientePorCpf = async (
  cpf: string,
  options?: { tenant?: string },
): Promise<ClientePlano> => {
  const normalized = normalizeCpf(cpf);
  if (normalized.length !== 11) {
    throw new Error("Informe um CPF válido com 11 dígitos.");
  }

  const searchResponse = await api.get("/titular/public/search", {
    params: {
      cpf: normalized,
      ...(options?.tenant ? { tenant: options.tenant } : {}),
    },
    ...(options?.tenant
      ? {
          headers: {
            "X-Tenant": options.tenant,
          },
        }
      : {}),
  });

  const candidato = searchResponse.data;
  if (!candidato) {
    throw new Error("Plano não encontrado para o CPF informado.");
  }

  // A rota pública já retorna os detalhes completos
  return mapTitularToCarteirinha(candidato);
};
