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
  beneficiarios: Array<string>;
  coberturas: {
    servicosPadrao: string[];
    coberturaTranslado: string[];
    servicosEspecificos: string[];
  };
}
