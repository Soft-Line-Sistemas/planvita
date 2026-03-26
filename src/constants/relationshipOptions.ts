export const RELATIONSHIP_OPTIONS = [
  "Cônjuge",
  "Filho(a)",
  "Pai",
  "Mãe",
  "Irmão(ã)",
  "Avô/Avó",
  "Neto(a)",
  "Tio(a)",
  "Sobrinho(a)",
  "Primo(a)",
  "Genro/Nora",
  "Cunhado(a)",
  "Outro",
] as const;

export type RelationshipOption = (typeof RELATIONSHIP_OPTIONS)[number];
