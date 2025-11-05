// utils/planos.ts
import { Plano } from "@/types/PlanType";

type PlanoBeneficio = NonNullable<Plano["beneficios"]>[number];
type PlanoCobertura = NonNullable<Plano["coberturas"]>[number];
type PlanoBeneficiario = NonNullable<Plano["beneficiarios"]>[number];

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = toNumber(value, NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const isPlanoBeneficio = (value: unknown): value is PlanoBeneficio => {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.id === "number" &&
    typeof data.nome === "string" &&
    typeof data.tipo === "string"
  );
};

const isPlanoCobertura = (value: unknown): value is PlanoCobertura => {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.id === "number" &&
    typeof data.tipo === "string" &&
    typeof data.descricao === "string"
  );
};

const isPlanoBeneficiario = (value: unknown): value is PlanoBeneficiario => {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return typeof data.id === "number" && typeof data.nome === "string";
};

export const sanitizePlano = (raw: unknown): Plano | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const idValue = data.id ?? data.codigo;
  const nome = data.nome;
  const valorMensal = toNumber(
    data.valorMensal ?? data.valor ?? data.precoMensal,
    NaN,
  );

  if (idValue === null || idValue === undefined) return null;
  if (typeof nome !== "string" || !Number.isFinite(valorMensal)) return null;

  return {
    id: String(idValue),
    nome,
    valorMensal,
    idadeMaxima: toNullableNumber(data.idadeMaxima ?? data.limiteIdade),
    coberturaMaxima: toNumber(data.coberturaMaxima ?? data.cobertura),
    carenciaDias: toNumber(data.carenciaDias ?? data.carencia),
    vigenciaMeses: toNumber(data.vigenciaMeses ?? data.vigencia),
    ativo: "ativo" in data ? Boolean(data.ativo) : true,
    totalClientes: toNumber(data.totalClientes ?? data.qtdClientes),
    receitaMensal: toNumber(data.receitaMensal ?? data.faturamentoMensal),
    assistenciaFuneral: toNumber(data.assistenciaFuneral ?? data.assistencia),
    auxilioCemiterio: toNullableNumber(
      data.auxilioCemiterio ?? data.auxilioCemiterioValor,
    ),
    taxaInclusaCemiterioPublico: Boolean(
      data.taxaInclusaCemiterioPublico ?? data.incluiTaxaCemiterioPublico,
    ),
    beneficios: Array.isArray(data.beneficios)
      ? data.beneficios.filter(isPlanoBeneficio)
      : [],
    coberturas: Array.isArray(data.coberturas)
      ? data.coberturas.filter(isPlanoCobertura)
      : [],
    beneficiarios: Array.isArray(data.beneficiarios)
      ? data.beneficiarios.filter(isPlanoBeneficiario)
      : [],
  };
};

export const sanitizePlanoArray = (payload: unknown): Plano[] => {
  const tryArrays: unknown[] = [];

  if (Array.isArray(payload)) {
    tryArrays.push(payload);
  } else if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const candidates = [
      record.data,
      record.planos,
      record.items,
      record.lista,
      record.result,
    ];
    candidates.forEach((candidate) => {
      if (Array.isArray(candidate)) tryArrays.push(candidate);
    });
  } else if (payload != null) {
    tryArrays.push([payload]);
  }

  const rawArray =
    tryArrays.find((arr): arr is unknown[] => Array.isArray(arr)) ?? [];

  return rawArray
    .map((item) => sanitizePlano(item))
    .filter((plano): plano is Plano => plano !== null);
};

/**
 * Tipo mínimo esperado para um participante (titular ou dependente).
 * Mantemos index signature para aceitar outras propriedades do seu objeto.
 */
export type ParticipanteMin = {
  dataNascimento?: string | null;
  idade?: number | null;
  nome?: string;
  [key: string]: unknown;
};

/** Retorna idade (anos inteiros) a partir de YYYY-MM-DD */
export function calcularIdade(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

/** Recebe array de participantes e retorna a maior idade encontrada */
export function obterMaiorIdadeParticipantes(
  participantes: ParticipanteMin[],
): number | null {
  let maior: number | null = null;

  participantes.forEach((p) => {
    const idadeFromDate = calcularIdade(p.dataNascimento ?? null);
    const idade =
      typeof p.idade === "number" && !isNaN(p.idade) ? p.idade : idadeFromDate;
    if (idade !== null && idade !== undefined) {
      if (maior === null || idade > maior) maior = idade;
    }
  });

  return maior;
}

/**
 * Seleciona o plano apropriado com base na maior idade entre participantes.
 * Regras:
 * 1) Se existir plano com idadeMaxima === null => retorna esse (prioridade).
 * 2) Senão, retorna o primeiro plano cuja idadeMaxima >= idadeMaximaParticipantes (menor idadeMaxima que cubra).
 * 3) Se nenhum cobrir, retorna o plano com maior idadeMaxima (fallback).
 */
export function selecionarPlanoPorMaiorIdade(
  planos: Plano[],
  idadeMaximaParticipantes: number | null,
): Plano | null {
  if (!planos || planos.length === 0) return null;

  // Prioriza plano sem limite
  const planoSemLimite = planos.find((p) => p.idadeMaxima === null);
  if (planoSemLimite) return planoSemLimite;

  // Se não temos idade, devolve plano com maior idadeMaxima
  if (idadeMaximaParticipantes === null) {
    return planos.reduce((prev, cur) => {
      const prevVal = prev.idadeMaxima ?? -Infinity;
      const curVal = cur.idadeMaxima ?? -Infinity;
      return prevVal > curVal ? prev : cur;
    });
  }

  // Filtra planos que cobrem a idade e escolhe o de menor idadeMaxima (ex: 60 em vez de 80)
  const planosQueCobrem = planos.filter(
    (p) =>
      typeof p.idadeMaxima === "number" &&
      p.idadeMaxima >= idadeMaximaParticipantes,
  );
  if (planosQueCobrem.length > 0) {
    return planosQueCobrem.reduce((prev, cur) => {
      // escolhe o menor idadeMaxima entre os que cobrem
      return prev.idadeMaxima! <= cur.idadeMaxima! ? prev : cur;
    });
  }

  // Fallback: maior idadeMaxima disponível
  return planos.reduce((prev, cur) => {
    const prevVal = prev.idadeMaxima ?? -Infinity;
    const curVal = cur.idadeMaxima ?? -Infinity;
    return prevVal > curVal ? prev : cur;
  });
}
