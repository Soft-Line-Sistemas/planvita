import { describe, expect, it } from "vitest";

import {
  normalizarMatrizTarifacaoDependente,
  obterMatrizTarifacaoDependente,
  obterValorAdicionalDependentePorIdade,
} from "@/utils/dependenteTarifacao";

describe("dependenteTarifacao", () => {
  it("usa matriz configurada por idade quando o JSON é válido", () => {
    const matriz = obterMatrizTarifacaoDependente(
      JSON.stringify([
        { idadeMaxima: 60, valor: 9.9 },
        { idadeMaxima: 70, valor: 19.9 },
        { idadeMaxima: 80, valor: 29.9 },
        { idadeMaxima: null, valor: 49 },
      ]),
      14.9,
    );

    expect(obterValorAdicionalDependentePorIdade(60, matriz)).toBe(9.9);
    expect(obterValorAdicionalDependentePorIdade(61, matriz)).toBe(19.9);
    expect(obterValorAdicionalDependentePorIdade(81, matriz)).toBe(49);
  });

  it("usa valor legado fixo quando não há matriz JSON válida", () => {
    const matriz = obterMatrizTarifacaoDependente(null, 14.9);

    expect(obterValorAdicionalDependentePorIdade(20, matriz)).toBe(14.9);
    expect(obterValorAdicionalDependentePorIdade(90, matriz)).toBe(14.9);
  });

  it("usa fallback padrão quando não há JSON nem valor legado", () => {
    const matriz = obterMatrizTarifacaoDependente(null, null);

    expect(obterValorAdicionalDependentePorIdade(60, matriz)).toBe(9.9);
    expect(obterValorAdicionalDependentePorIdade(75, matriz)).toBe(29.9);
    expect(obterValorAdicionalDependentePorIdade(95, matriz)).toBe(49);
  });

  it("normaliza formato salvo pela UI e acrescenta faixa aberta final se faltar", () => {
    const matriz = normalizarMatrizTarifacaoDependente([
      { idadeMaxima: 30, valor: 5.9 },
      { idadeMaxima: 59, valor: 14.9 },
      { idadeMaxima: 69, valor: 24.9 },
    ]);

    expect(matriz).toEqual([
      { idadeMaxima: 30, valor: 5.9 },
      { idadeMaxima: 59, valor: 14.9 },
      { idadeMaxima: 69, valor: 24.9 },
      { idadeMaxima: null, valor: 24.9 },
    ]);
  });
});
