import { StatusPagamento, Pagamento, MetodoPagamento } from "./PaymentType";
import { Dependente } from "./DependentesType";
import { Plano as PlanoBase } from "./PlanType";

export interface Endereco {
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  pontoReferencia?: string;
}

export interface Cobertura {
  nome: string;
  descricao: string;
  observacoes?: string;
}

// Extensão do PlanoBase para casos específicos de ClientType se necessário
export interface Plano extends PlanoBase {
  coberturasDetalhadas?: {
    servicosPadrao: Cobertura[];
    coberturaTranslado: Cobertura[];
    servicosEspecificos: Cobertura[];
  };
}

export interface Consultor {
  nome: string;
  codigo: string;
  email: string;
  telefone: string;
}

export interface ResponsavelFinanceiro {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  relacionamento: string;
  situacaoConjugal?: string;
  profissao?: string;
  sexo?: string;
  naturalidade?: string;
  cep?: string;
  uf?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  pontoReferencia?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  whatsapp?: string;
  situacaoConjugal?: string;
  profissao?: string;
  sexo?: string;
  rg?: string;
  naturalidade?: string;
  dataNascimento: string;
  idade: number;
  endereco: Endereco;
  statusPlano: string;
  dataContratacao: string;
  dataCarencia: string;
  carenciaRestante: number;
  diaVencimento: number;
  plano: Plano;
  consultor: Consultor;
  responsavelFinanceiro?: ResponsavelFinanceiro;
  dependentes: Dependente[];
  pagamentos: Pagamento[];
}
