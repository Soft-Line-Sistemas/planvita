import api from "@/utils/api";

export type BancoFinanceiro = {
  id: number;
  nome: string;
  agencia: string | null;
  conta: string | null;
  saldo: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TipoContabilFinanceiro = {
  id: number;
  descricao: string;
  natureza: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FormaPagamentoFinanceira = {
  id: number;
  nome: string;
  prazo: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CentroResultadoFinanceiro = {
  id: number;
  nome: string;
  descricao: string | null;
  orcamento: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface FinanceiroCadastrosResponse {
  bancos: BancoFinanceiro[];
  tiposContabeis: TipoContabilFinanceiro[];
  formasPagamento: FormaPagamentoFinanceira[];
  centrosResultado: CentroResultadoFinanceiro[];
}

export const fetchFinanceiroCadastros =
  async (): Promise<FinanceiroCadastrosResponse> => {
    const { data } = await api.get<FinanceiroCadastrosResponse>(
      "/financeiro/cadastros",
    );
    return data;
  };

export const createBancoFinanceiro = async (payload: {
  nome: string;
  agencia?: string;
  conta?: string;
  saldo?: number;
}) => {
  const { data } = await api.post<BancoFinanceiro>(
    "/financeiro/cadastros/bancos",
    payload,
  );
  return data;
};

export const deleteBancoFinanceiro = async (id: number) => {
  await api.delete(`/financeiro/cadastros/bancos/${id}`);
};

export const createTipoContabilFinanceiro = async (payload: {
  descricao: string;
  natureza?: string;
}) => {
  const { data } = await api.post<TipoContabilFinanceiro>(
    "/financeiro/cadastros/tipos",
    payload,
  );
  return data;
};

export const deleteTipoContabilFinanceiro = async (id: number) => {
  await api.delete(`/financeiro/cadastros/tipos/${id}`);
};

export const createFormaPagamentoFinanceira = async (payload: {
  nome: string;
  prazo?: string;
}) => {
  const { data } = await api.post<FormaPagamentoFinanceira>(
    "/financeiro/cadastros/formas",
    payload,
  );
  return data;
};

export const deleteFormaPagamentoFinanceira = async (id: number) => {
  await api.delete(`/financeiro/cadastros/formas/${id}`);
};

export const createCentroResultadoFinanceiro = async (payload: {
  nome: string;
  descricao?: string;
  orcamento?: number;
}) => {
  const { data } = await api.post<CentroResultadoFinanceiro>(
    "/financeiro/cadastros/centros",
    payload,
  );
  return data;
};

export const deleteCentroResultadoFinanceiro = async (id: number) => {
  await api.delete(`/financeiro/cadastros/centros/${id}`);
};
