interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  plano: string;
}

export type StatusPagamento = "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
type MetodoPagamento = "Boleto" | "PIX" | "Cartão de Crédito";

export interface Pagamento {
  id: string;
  cliente: Cliente;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: StatusPagamento;
  metodoPagamento: MetodoPagamento;
  referencia: string;
  diasAtraso: number;
  observacoes: string;
}
