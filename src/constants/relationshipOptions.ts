export const RELATIONSHIP_OPTIONS = ["1° Grau", "2° Grau", "Outro"] as const;

export type RelationshipOption = (typeof RELATIONSHIP_OPTIONS)[number];
