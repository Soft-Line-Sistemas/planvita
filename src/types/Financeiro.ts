export type StatusContaPagar = "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";
export type StatusContaReceber =
  | "PENDENTE"
  | "CONFIRMADO"
  | "RECEBIDO"
  | "ATRASADO"
  | "VENCIDO"
  | "CANCELADO";

export type StatusFinanceiro =
  | "PENDENTE"
  | "CONFIRMADO"
  | "PAGO"
  | "RECEBIDO"
  | "ATRASADO"
  | "VENCIDO"
  | "CANCELADO";

export type TipoConta = "Pagar" | "Receber";

export interface ContaClienteRef {
  id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
}

export interface ContaFinanceiraBase {
  id: number;
  tipo: TipoConta;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: StatusFinanceiro;
  parceiro?: string | null;
  contato?: string | null;
  clienteId?: number | null;
  cliente?: ContaClienteRef | null;
  asaasPaymentId?: string | null;
  asaasSubscriptionId?: string | null;
  paymentUrl?: string | null;
  pixQrCode?: string | null;
  pixExpiration?: string | null;
  metodoPagamento?: string | null;
  dataPagamento?: string | null;
  dataRecebimento?: string | null;
  observacao?: string | null;
}

export type ContaFinanceira = ContaFinanceiraBase & {
  tipo: "Pagar" | "Receber";
};

export const getStatusConta = (conta: ContaFinanceira): StatusFinanceiro =>
  conta.status;

export const getDiasAtraso = (conta: ContaFinanceira): number => {
  const vencimento = new Date(conta.dataVencimento);
  const hoje = new Date();
  const diff = hoje.getTime() - vencimento.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 0;
};
