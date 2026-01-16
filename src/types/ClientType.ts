import { StatusPagamento } from "./PaymentType";

interface Endereco {
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento?: string;
}

interface Cobertura {
  nome: string;
  descricao: string;
  observacoes?: string;
}

interface Plano {
  id: string;
  nome: string;
  valorMensal: number;
  coberturas: {
    servicosPadrao: Cobertura[];
    coberturaTranslado: Cobertura[];
    servicosEspecificos: Cobertura[];
  };
}

interface Consultor {
  nome: string;
  codigo: string;
  email: string;
  telefone: string;
}

interface Dependente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  idade: number;
  parentesco: string;
  carenciaRestante: number;
}

type MetodoPagamento = "Boleto" | "PIX" | "Cartão de Crédito";

interface Pagamento {
  asaasSubscriptionId?: string | null;
  asaasPaymentId?: string | null;
  id: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: StatusPagamento;
  metodoPagamento: MetodoPagamento;
  diasAtraso?: number;
  referencia?: string;
  observacoes?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  whatsapp?: string;
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
  dependentes: Dependente[];
  pagamentos: Pagamento[];
}
