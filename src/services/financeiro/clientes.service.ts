import api from "@/utils/api";

type ClientesApiResponse = {
  data: Array<{
    id: number | string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    cpf?: string | null;
  }>;
};

export type ClienteFinanceiroResumo = {
  id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
};

export const buscarClientesFinanceiro = async (
  search: string,
  limit = 25,
): Promise<ClienteFinanceiroResumo[]> => {
  const params = new URLSearchParams({
    page: "1",
    limit: String(limit),
    search: search.trim(),
    status: "todos",
    plano: "todos",
  });

  const { data } = await api.get<ClientesApiResponse>(
    `/titular?${params.toString()}`,
  );
  const lista = Array.isArray(data?.data) ? data.data : [];

  return lista.map((cliente) => ({
    id: Number(cliente.id),
    nome: cliente.nome,
    email: cliente.email ?? "",
    telefone: cliente.telefone ?? "",
    cpf: cliente.cpf ?? "",
  }));
};
