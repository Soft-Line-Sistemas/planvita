import api from "@/utils/api";

export type CriarDependentePayload = {
  titularId: number;
  nome: string;
  dataNascimento: string;
  tipoDependente: string;
};

export const criarDependente = async (payload: CriarDependentePayload) => {
  const { data } = await api.post("/dependente", payload);
  return data;
};
