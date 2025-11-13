import api from "@/utils/api";

export type RelatorioFinanceiroResponse = {
  totais: {
    entradas: number;
    saidas: number;
    lucro: number;
    margem: number;
  };
  mensal: Array<{
    mes: string;
    entradas: number;
    saidas: number;
  }>;
  distribuicao: Array<{
    nome: string;
    valor: number;
  }>;
  comissoes: Array<{
    nome: string;
    vendas: number;
    comissao: number;
  }>;
  recibos: Array<{
    tipo: string;
    total: number;
  }>;
};

export const fetchRelatorioFinanceiro =
  async (): Promise<RelatorioFinanceiroResponse> => {
    const { data } = await api.get<RelatorioFinanceiroResponse>(
      "/financeiro/relatorios",
    );
    return data;
  };
