import api from "@/utils/api";
import type { ClientePlano } from "@/types/ClientePlano";

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
  vigenciaMeses?: number | null;
  coberturas?: Array<{ descricao?: string | null; tipo?: string | null }>;
};

type TitularResponse = {
  id?: number | null;
  nome?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  statusPlano?: string | null;
  dataContratacao?: string | null;
  plano?: PlanoResponse | null;
  dependentes?: Array<{
    id?: number | null;
    nome?: string | null;
    dataNascimento?: string | null;
    tipoDependente?: string | null;
  }> | null;
};

const mapTitularToCarteirinha = (titular: TitularResponse): ClientePlano => {
  const plano = titular?.plano ?? null;
  const cobertura =
    plano?.coberturas?.map(
      (item) => item?.descricao || item?.tipo || "Cobertura incluída",
    ) ?? [];

  const dependentes =
    titular?.dependentes?.map((dep) => ({
      id: dep?.id ?? 0,
      nome: dep?.nome ?? "Dependente",
      dataNascimento: dep?.dataNascimento ?? null,
      tipo: dep?.tipoDependente ?? null,
    })) ?? [];

  const vigenciaInicio = titular?.dataContratacao ?? new Date().toISOString();
  const vigenciaFim = addMonths(vigenciaInicio, plano?.vigenciaMeses ?? 12);

  const numeroCarteirinha = `PV-${String(titular?.id ?? "000000").padStart(
    6,
    "0",
  )}`;

  const statusPlano = String(titular?.statusPlano || "ativo").toLowerCase();
  const statusMapped: ClientePlano["plano"]["status"] =
    statusPlano === "ativo"
      ? "ativo"
      : statusPlano === "suspenso"
        ? "suspenso"
        : "inativo";

  return {
    titularId: titular?.id ?? null,
    cpf: formatCpf(titular?.cpf ?? ""),
    nome: titular?.nome ?? "Titular não identificado",
    numeroCarteirinha,
    email: titular?.email ?? undefined,
    telefone: titular?.telefone ?? undefined,
    plano: {
      id: plano?.id ? String(plano.id) : "plano-indefinido",
      nome: plano?.nome ?? "Plano não informado",
      codigo: plano?.codigo ?? `PLN-${plano?.id ?? "N/D"}`,
      status: statusMapped,
      vigencia: {
        inicio: vigenciaInicio,
        fim: vigenciaFim,
      },
      valorMensal: plano?.valorMensal ?? 0,
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
): Promise<ClientePlano> => {
  const normalized = normalizeCpf(cpf);
  if (normalized.length !== 11) {
    throw new Error("Informe um CPF válido com 11 dígitos.");
  }

  const searchResponse = await api.get("/titular/public/search", {
    params: {
      cpf: normalized,
    },
  });

  const candidato = searchResponse.data;
  if (!candidato) {
    throw new Error("Plano não encontrado para o CPF informado.");
  }

  // A rota pública já retorna os detalhes completos
  return mapTitularToCarteirinha(candidato);
};
