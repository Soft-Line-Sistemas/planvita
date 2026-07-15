export type FaixaTarifacaoDependente = {
  idadeMaxima: number | null;
  valor: number;
};

const MATRIZ_PROGRESSIVA_PADRAO: FaixaTarifacaoDependente[] = [
  { idadeMaxima: 60, valor: 9.9 },
  { idadeMaxima: 70, valor: 19.9 },
  { idadeMaxima: 80, valor: 29.9 },
  { idadeMaxima: null, valor: 49 },
];

const arredondarMoeda = (valor: number): number =>
  Math.round((valor + Number.EPSILON) * 100) / 100;

export function normalizarMatrizTarifacaoDependente(
  raw: unknown,
): FaixaTarifacaoDependente[] | null {
  if (!Array.isArray(raw)) return null;

  const faixas = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const registro = item as Record<string, unknown>;
      const idadeMaximaRaw =
        registro.idadeMaxima ?? registro.maxAge ?? registro.ageLimit ?? null;
      const valorRaw =
        registro.valor ?? registro.value ?? registro.tarifa ?? null;
      const valor = Number(valorRaw);

      if (!Number.isFinite(valor) || valor < 0) return null;

      if (
        idadeMaximaRaw === null ||
        idadeMaximaRaw === undefined ||
        idadeMaximaRaw === ""
      ) {
        return { idadeMaxima: null, valor: arredondarMoeda(valor) };
      }

      const idadeMaxima = Number(idadeMaximaRaw);
      if (!Number.isInteger(idadeMaxima) || idadeMaxima < 0) return null;

      return {
        idadeMaxima,
        valor: arredondarMoeda(valor),
      };
    })
    .filter((item): item is FaixaTarifacaoDependente => item !== null)
    .sort((a, b) => {
      if (a.idadeMaxima === null) return 1;
      if (b.idadeMaxima === null) return -1;
      return a.idadeMaxima - b.idadeMaxima;
    });

  if (!faixas.length) return null;

  const ultimaFaixa = faixas[faixas.length - 1];
  if (ultimaFaixa.idadeMaxima !== null) {
    faixas.push({
      idadeMaxima: null,
      valor: ultimaFaixa.valor,
    });
  }

  return faixas;
}

export function obterMatrizTarifacaoDependente(
  matrizRaw: unknown,
  valorLegado?: number | null,
): FaixaTarifacaoDependente[] {
  if (typeof matrizRaw === "string" && matrizRaw.trim()) {
    try {
      const parsed = JSON.parse(matrizRaw);
      const matriz = normalizarMatrizTarifacaoDependente(parsed);
      if (matriz) return matriz;
    } catch {
      // fallback abaixo
    }
  } else {
    const matriz = normalizarMatrizTarifacaoDependente(matrizRaw);
    if (matriz) return matriz;
  }

  const valorLegadoNormalizado = Number(valorLegado ?? NaN);
  if (Number.isFinite(valorLegadoNormalizado) && valorLegadoNormalizado >= 0) {
    return [
      {
        idadeMaxima: null,
        valor: arredondarMoeda(valorLegadoNormalizado),
      },
    ];
  }

  return MATRIZ_PROGRESSIVA_PADRAO;
}

export function obterValorAdicionalDependentePorIdade(
  idade: number | null,
  matriz: FaixaTarifacaoDependente[],
): number {
  for (const faixa of matriz) {
    if (
      idade === null ||
      faixa.idadeMaxima === null ||
      idade <= faixa.idadeMaxima
    ) {
      return faixa.valor;
    }
  }

  return matriz[matriz.length - 1]?.valor ?? 0;
}
