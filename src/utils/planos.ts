// utils/planos.ts
import { Plano } from "@/types/PlanType";
import { calculateAgeFromBirthDate } from "@/utils/date";

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

const normalizeCoberturas = (value: unknown): PlanoCobertura[] => {
  if (Array.isArray(value)) {
    return value.filter(isPlanoCobertura);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const registro = value as Record<string, unknown>;
  const output: PlanoCobertura[] = [];
  let idx = 1;
  const pushItens = (tipo: string, maybeArray: unknown) => {
    if (!Array.isArray(maybeArray)) return;
    maybeArray.forEach((item) => {
      if (typeof item !== "string" || item.trim() === "") return;
      output.push({
        id: idx++,
        tipo,
        descricao: item.trim(),
      });
    });
  };

  pushItens("servicosPadrao", registro.servicosPadrao);
  pushItens("coberturaTranslado", registro.coberturaTranslado);
  pushItens("servicosEspecificos", registro.servicosEspecificos);

  return output;
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
      : normalizeCoberturas(data.coberturas),
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
  parentesco?: string | null;
  [key: string]: unknown;
};

/** Retorna idade (anos inteiros) a partir de YYYY-MM-DD */
export function calcularIdade(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  return calculateAgeFromBirthDate(dataNascimento);
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
 * `idadeMaxima` é usado como início de faixa:
 * 1) Retorna o plano com a maior faixa <= maior idade do grupo.
 * 2) Se nenhuma faixa definida atender, usa o plano sem limite como fallback.
 * 3) Se ainda assim não houver opção sem limite, retorna a menor faixa disponível.
 */
export function selecionarPlanoPorMaiorIdade(
  planos: Plano[],
  idadeMaximaParticipantes: number | null,
): Plano | null {
  if (!planos || planos.length === 0) return null;

  const planosOrdenados = [...planos].sort((a, b) => {
    const idadeA = a.idadeMaxima ?? Number.POSITIVE_INFINITY;
    const idadeB = b.idadeMaxima ?? Number.POSITIVE_INFINITY;
    return idadeA - idadeB || a.valorMensal - b.valorMensal;
  });

  // Se não temos idade, devolve a menor faixa configurada
  if (idadeMaximaParticipantes === null) {
    return (
      planosOrdenados.find(
        (plano) =>
          typeof plano.idadeMaxima === "number" &&
          Number.isFinite(plano.idadeMaxima),
      ) ??
      planosOrdenados.find((plano) => plano.idadeMaxima === null) ??
      planosOrdenados[0]
    );
  }

  const planosComFaixa = planosOrdenados.filter(
    (p) => typeof p.idadeMaxima === "number" && Number.isFinite(p.idadeMaxima),
  );
  const planoSemLimite =
    planosOrdenados.find((p) => p.idadeMaxima === null) ?? null;

  if (planosComFaixa.length === 0) {
    return planoSemLimite ?? planosOrdenados[0] ?? null;
  }

  const faixaCompativel = planosComFaixa.find(
    (plano) => idadeMaximaParticipantes <= (plano.idadeMaxima as number),
  );

  return faixaCompativel ?? planoSemLimite ?? null;
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRelationship(value?: string | null) {
  const normalized = normalizeText(value);
  const aliases: Record<string, string[]> = {
    titular: ["titular", "responsavel", "contratante"],
    primeiro_grau: ["1 grau", "1o grau"],
    segundo_grau: ["2 grau", "2o grau"],
    conjuge: [
      "conjuge",
      "esposa",
      "esposo",
      "marido",
      "companheira",
      "companheiro",
      "parceira",
      "parceiro",
    ],
    filho: [
      "filho",
      "filha",
      "filho a",
      "enteado",
      "enteada",
      "enteado a",
      "menor",
      "crianca",
    ],
    pai: ["pai", "genitor", "padrasto", "sogro", "sogro a"],
    mae: ["mae", "genitora", "madrasta", "sogra"],
    irmao: ["irmao", "irma", "irmao a"],
    avo: ["avo", "avo avo", "avos", "bisavo", "bisavoa"],
    neto: ["neto", "neta", "neto a", "bisneto", "bisneta"],
    genro: ["genro", "nora", "genro nora"],
    cunhado: ["cunhado", "cunhada", "cunhado a"],
    outro: [
      "outro",
      "outra",
      "agregado",
      "amigo",
      "amiga",
      "vizinho",
      "vizinha",
      "sem parentesco",
      "nao familiar",
      "tio",
      "tia",
      "tio a",
      "sobrinho",
      "sobrinha",
      "sobrinho a",
      "primo",
      "prima",
      "primo a",
    ],
  };

  for (const [canonical, values] of Object.entries(aliases)) {
    if (values.includes(normalized)) {
      return canonical;
    }
  }

  return normalized;
}

function isPlanoSocial(nome?: string | null) {
  return normalizeText(nome).includes("social");
}

function isPlanoEssencial(nome?: string | null) {
  return normalizeText(nome).includes("essencial");
}

function isElegivelSocialEssencial(participantes: ParticipanteMin[]) {
  if (!participantes.length) return false;
  const permitidos = new Set(["titular", "conjuge", "filho", "neto"]);

  return participantes.every((participante) => {
    const parentesco = normalizeRelationship(participante.parentesco);
    const idade =
      typeof participante.idade === "number"
        ? participante.idade
        : calcularIdade(participante.dataNascimento ?? null);

    return (
      permitidos.has(parentesco) &&
      typeof idade === "number" &&
      Number.isFinite(idade) &&
      idade <= 55
    );
  });
}

export function selecionarPlanosCompativeis(
  planos: Plano[],
  participantes: ParticipanteMin[],
): Plano[] {
  if (!planos.length) return [];

  const maiorIdadeParticipantes = obterMaiorIdadeParticipantes(participantes);
  if (maiorIdadeParticipantes === null) return planos;

  const permitirSocialEssencial = isElegivelSocialEssencial(participantes);

  const planosOrdenados = [...planos].sort((a, b) => {
    const idadeA = a.idadeMaxima ?? Number.POSITIVE_INFINITY;
    const idadeB = b.idadeMaxima ?? Number.POSITIVE_INFINITY;
    return (
      idadeA - idadeB ||
      a.valorMensal - b.valorMensal ||
      a.nome.localeCompare(b.nome)
    );
  });

  if (permitirSocialEssencial) {
    const socialEssencial = planosOrdenados.filter(
      (plano) => isPlanoSocial(plano.nome) || isPlanoEssencial(plano.nome),
    );
    if (socialEssencial.length > 0) {
      return socialEssencial;
    }
  }

  const candidatosPorFaixa = planosOrdenados.filter((plano) => {
    if (plano.idadeMaxima == null) return true;
    return maiorIdadeParticipantes <= plano.idadeMaxima;
  });

  const candidatosSemSocial = permitirSocialEssencial
    ? candidatosPorFaixa
    : candidatosPorFaixa.filter((plano) => !isPlanoSocial(plano.nome));

  if (candidatosSemSocial.length === 0) {
    return [];
  }

  const menorFaixaCompativel =
    candidatosSemSocial.find(
      (plano) =>
        typeof plano.idadeMaxima === "number" &&
        Number.isFinite(plano.idadeMaxima),
    )?.idadeMaxima ?? null;

  if (menorFaixaCompativel == null) {
    return candidatosSemSocial.filter((plano) => plano.idadeMaxima == null);
  }

  return candidatosSemSocial.filter(
    (plano) => plano.idadeMaxima === menorFaixaCompativel,
  );
}
