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

export type AtualizarDependentePayload = {
  id: number;
  excluirCobrancaAdicional: boolean;
};

export const atualizarDependente = async (
  payload: AtualizarDependentePayload,
) => {
  const { data } = await api.put(`/dependente/${payload.id}`, {
    excluirCobrancaAdicional: payload.excluirCobrancaAdicional,
  });
  return data;
};
