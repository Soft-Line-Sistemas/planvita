import { describe, expect, it } from "vitest";

import { RELATIONSHIP_OPTIONS } from "@/constants/relationshipOptions";
import {
  selecionarPlanosCompativeis,
  type ParticipanteMin,
} from "@/utils/planos";
import type { Plano } from "@/types/PlanType";

const makePlano = (
  id: string,
  nome: string,
  idadeMaxima: number | null,
): Plano => ({
  id,
  nome,
  idadeMaxima,
  valorMensal: Number(id) * 10,
  coberturaMaxima: 0,
  carenciaDias: 0,
  vigenciaMeses: 0,
  ativo: true,
  totalClientes: 0,
  receitaMensal: 0,
  assistenciaFuneral: 0,
  auxilioCemiterio: null,
  taxaInclusaCemiterioPublico: false,
  beneficios: [],
  coberturas: [],
  beneficiarios: [],
});

const PLANOS = [
  makePlano("26", "Bosque Social", 55),
  makePlano("27", "Bosque Essencial", 60),
  makePlano("28", "Bosque Plus", 70),
  makePlano("29", "Bosque Família", 80),
  makePlano("30", "Bosque Sênior", 85),
  makePlano("31", "Bosque Premium", null),
];

describe("selecionarPlanosCompativeis", () => {
  it("mantem social e essencial quando todos os participantes cabem nessa regra", () => {
    const participantes: ParticipanteMin[] = [
      { dataNascimento: "2000-07-16", parentesco: "Titular" },
      { dataNascimento: "2015-01-01", parentesco: "Filho(a)" },
    ];

    const result = selecionarPlanosCompativeis(PLANOS, participantes);

    expect(result.map((plano) => plano.nome)).toEqual([
      "Bosque Social",
      "Bosque Essencial",
    ]);
  });

  it("quando um irmao invalida o social, sobe para a proxima faixa compativel", () => {
    const participantes: ParticipanteMin[] = [
      { dataNascimento: "2000-07-16", parentesco: "Titular" },
      { dataNascimento: "2002-01-01", parentesco: "Irmão(ã)" },
    ];

    const result = selecionarPlanosCompativeis(PLANOS, participantes);

    expect(result.map((plano) => plano.nome)).toEqual(["Bosque Essencial"]);
  });

  it("com parentesco nao elegivel e idade maior, retorna a menor faixa acima da idade", () => {
    const participantes: ParticipanteMin[] = [
      { dataNascimento: "2000-07-16", parentesco: "Titular" },
      { dataNascimento: "1958-01-01", parentesco: "Pai" },
    ];

    const result = selecionarPlanosCompativeis(PLANOS, participantes);

    expect(result.map((plano) => plano.nome)).toEqual(["Bosque Plus"]);
  });

  it("mantem compatibilidade para as categorias resumidas da interface", () => {
    const titular: ParticipanteMin = {
      dataNascimento: "2000-07-16",
      parentesco: "Titular",
    };

    const expectedPlanByRelationship = new Map<string, string[]>([
      ["1° Grau", ["Bosque Essencial"]],
      ["2° Grau", ["Bosque Essencial"]],
      ["Outro", ["Bosque Essencial"]],
    ]);

    for (const relationship of RELATIONSHIP_OPTIONS) {
      const participantes: ParticipanteMin[] = [
        titular,
        {
          dataNascimento: "2002-01-01",
          parentesco: relationship,
        },
      ];

      const result = selecionarPlanosCompativeis(PLANOS, participantes);

      expect(
        result.map((plano) => plano.nome),
        relationship,
      ).toEqual(expectedPlanByRelationship.get(relationship));
    }
  });
});
