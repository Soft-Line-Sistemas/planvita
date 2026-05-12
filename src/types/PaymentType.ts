import { StatusFinanceiro } from "./Financeiro";

export type StatusPagamento = StatusFinanceiro;

export type MetodoPagamento = "Boleto" | "PIX" | "Cartão de Crédito";

export interface Pagamento {
  id: string;
  cliente: {
    id?: string;
    nome: string;
    cpf: string;
    email: string;
    telefone?: string;
    plano?: string;
  };
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: StatusPagamento;
  metodoPagamento: MetodoPagamento;
  referencia: string;
  diasAtraso: number;
  observacoes: string;
  asaasPaymentId?: string;
  asaasSubscriptionId?: string;
}
