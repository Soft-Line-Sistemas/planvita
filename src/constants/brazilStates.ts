export const BRAZIL_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapa" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceara" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espirito Santo" },
  { code: "GO", name: "Goias" },
  { code: "MA", name: "Maranhao" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Para" },
  { code: "PB", name: "Paraiba" },
  { code: "PR", name: "Parana" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piaui" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondonia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "Sao Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
] as const;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

const stateLookup = new Map<string, string>();

BRAZIL_STATES.forEach((state) => {
  stateLookup.set(state.code, state.code);
  stateLookup.set(normalizeText(state.name), state.code);
});

stateLookup.set("DISTRITO FEDERAL", "DF");

export const normalizeUfCode = (value?: string | null): string => {
  const normalized = normalizeText(String(value ?? ""));
  if (!normalized) return "";
  return stateLookup.get(normalized) ?? "";
};
