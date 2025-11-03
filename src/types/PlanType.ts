export interface Plano {
  id: string;
  nome: string;
  valorMensal: number;
  idadeMaxima: number | null;
  coberturaMaxima: number;
  carenciaDias: number;
  vigenciaMeses: number;
  ativo: boolean;
  totalClientes: number;
  receitaMensal: number;
  assistenciaFuneral: number;
  auxilioCemiterio: number | null;
  taxaInclusaCemiterioPublico: boolean;
  beneficios?: {
    id: number;
    nome: string;
    tipo: string;
    descricao?: string | null;
    valor?: number | null;
    validade?: number | null;
  }[];
  coberturas?: { id: number; tipo: string; descricao: string }[];
  beneficiarios?: { id: number; nome: string }[];
}

export type Beneficio = {
  id: number;
  nome: string;
  tipo: string;
  descricao: string;
  valor?: number | null;
  validade?: number | null;
};
