export const RELATIONSHIP_OPTIONS = [
  "Cônjuge",
  "Companheiro(a)",
  "Filho(a)",
  "Enteado(a)",
  "Pai",
  "Mãe",
  "Padrasto",
  "Madrasta",
  "Sogro(a)",
  "Irmão(ã)",
  "Avô/Avó",
  "Neto(a)",
  "Tio(a)",
  "Outro",
] as const;

export type RelationshipOption = (typeof RELATIONSHIP_OPTIONS)[number];

const normalizeRelationshipText = (value?: string | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const DIRECT_FAMILY_RELATIONSHIP_ALIASES = new Set<string>([
  "conjuge",
  "companheiro",
  "companheira",
  "companheiro a",
  "filho",
  "filha",
  "filho a",
  "enteado",
  "enteada",
  "enteado a",
  "pai",
  "mae",
  "padrasto",
  "madrasta",
  "sogro",
  "sogra",
  "sogro a",
  "neto",
  "neta",
  "neto a",
  "1 grau",
  "1o grau",
]);

const RESPONSAVEL_FINANCEIRO_RELATIONSHIP_ALIASES = new Set<string>([
  "conjuge",
  "companheiro",
  "companheira",
  "companheiro a",
]);

export const isDirectFamilyRelationship = (value?: string | null): boolean =>
  DIRECT_FAMILY_RELATIONSHIP_ALIASES.has(normalizeRelationshipText(value));

export const isResponsibleFinancialRelationshipInPlan = (
  value?: string | null,
): boolean =>
  RESPONSAVEL_FINANCEIRO_RELATIONSHIP_ALIASES.has(
    normalizeRelationshipText(value),
  );
