import { describe, expect, it } from "vitest";

import {
  isDirectFamilyRelationship,
  isResponsibleFinancialRelationshipInPlan,
} from "@/constants/relationshipOptions";

describe("isDirectFamilyRelationship", () => {
  it("mantem como diretos apenas os parentescos da grade sem adicional", () => {
    expect(isDirectFamilyRelationship("Cônjuge")).toBe(true);
    expect(isDirectFamilyRelationship("Companheiro(a)")).toBe(true);
    expect(isDirectFamilyRelationship("Filho(a)")).toBe(true);
    expect(isDirectFamilyRelationship("Enteado(a)")).toBe(true);
    expect(isDirectFamilyRelationship("Pai")).toBe(true);
    expect(isDirectFamilyRelationship("Mãe")).toBe(true);
    expect(isDirectFamilyRelationship("Padrasto")).toBe(true);
    expect(isDirectFamilyRelationship("Madrasta")).toBe(true);
    expect(isDirectFamilyRelationship("Sogro(a)")).toBe(true);
    expect(isDirectFamilyRelationship("Neto(a)")).toBe(true);
    expect(isDirectFamilyRelationship("1° Grau")).toBe(true);
  });

  it("classifica indiretos e outros como adicionais por parentesco", () => {
    expect(isDirectFamilyRelationship("Irmão(ã)")).toBe(false);
    expect(isDirectFamilyRelationship("Avô/Avó")).toBe(false);
    expect(isDirectFamilyRelationship("Tio(a)")).toBe(false);
    expect(isDirectFamilyRelationship("2° Grau")).toBe(false);
    expect(isDirectFamilyRelationship("Outro")).toBe(false);
  });

  it("inclui o corresponsavel na composicao do plano para qualquer parentesco valido diferente de titular", () => {
    expect(isResponsibleFinancialRelationshipInPlan("Cônjuge")).toBe(true);
    expect(isResponsibleFinancialRelationshipInPlan("Companheiro(a)")).toBe(
      true,
    );
    expect(isResponsibleFinancialRelationshipInPlan("Pai")).toBe(true);
    expect(isResponsibleFinancialRelationshipInPlan("Irmão(ã)")).toBe(true);
    expect(isResponsibleFinancialRelationshipInPlan("Outro")).toBe(true);
    expect(isResponsibleFinancialRelationshipInPlan("Titular")).toBe(false);
    expect(isResponsibleFinancialRelationshipInPlan("")).toBe(false);
  });
});
