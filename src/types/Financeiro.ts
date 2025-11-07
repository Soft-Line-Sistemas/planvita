// ================================
// 📘 ENUMS E TIPOS BÁSICOS
// ================================

export type StatusContaPagar = "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";
export type StatusContaReceber =
  | "PENDENTE"
  | "RECEBIDO"
  | "ATRASADO"
  | "CANCELADO";

// 🔹 Tipo unificado — evita conflito no setState
export type StatusFinanceiro =
  | "PENDENTE"
  | "PAGO"
  | "RECEBIDO"
  | "ATRASADO"
  | "CANCELADO";

export type FormaPagamento =
  | "PIX"
  | "Boleto"
  | "Transferência"
  | "Dinheiro"
  | "Cartão"
  | "Depósito"
  | "Cheque";

// ================================
// 📘 ESTRUTURAS BASE
// ================================

export interface BaixaFinanceira {
  data_baixa: string;
  usuario_id: number;
  conta_bancaria_id: number;
  valor_baixado: number;
  observacao?: string;
}

export interface EstornoFinanceiro {
  data_estorno: string;
  usuario_id: number;
  motivo: string;
  valor_estornado: number;
}

// ================================
// 💰 CONTAS A PAGAR
// ================================

export interface ContaPagar {
  id_conta_pagar: number;
  fornecedor_id: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string | null;
  valor_original: number;
  valor_pago?: number | null;
  juros: number;
  multa: number;
  desconto: number;
  status: StatusContaPagar;
  forma_pagamento: FormaPagamento;
  categoria_id: number;
  observacao?: string;
  centro_custo_id?: number;
  numero_documento?: string;
  usuario_responsavel_id?: number;
  origem_lancamento?: string;
  recorrencia_id?: number;
  anexo_documento?: string;
  conta_bancaria_id?: number;
  projeto_id?: number;
  rateio?: string;
  saldo_atualizado?: number;

  // 🔹 Controle operacional
  baixa?: BaixaFinanceira | null;
  estorno?: EstornoFinanceiro | null;
}

// ================================
// 💵 CONTAS A RECEBER
// ================================

export interface ContaReceber {
  id_conta_receber: number;
  cliente_id: number;
  data_emissao: string;
  data_vencimento: string;
  data_recebimento?: string | null;
  valor_original: number;
  valor_recebido?: number | null;
  juros_recebido: number;
  desconto_concedido: number;
  status: StatusContaReceber;
  forma_recebimento: FormaPagamento;
  categoria_id: number;
  observacao?: string;
  centro_custo_id?: number;
  numero_documento?: string;
  usuario_responsavel_id?: number;
  origem_lancamento?: string;
  recorrencia_id?: number;
  anexo_documento?: string;
  conta_bancaria_id?: number;
  projeto_id?: number;
  rateio?: string;
  saldo_atualizado?: number;

  // 🔹 Controle operacional
  baixa?: BaixaFinanceira | null;
  estorno?: EstornoFinanceiro | null;
}

// ================================
// 🧩 UNIFICADOR INTELIGENTE
// ================================

export type TipoConta = "Pagar" | "Receber";

/**
 * Tipo unificado usado nas telas e tabelas do sistema.
 * Permite tratar contas a pagar e receber de forma coesa,
 * sem perder a tipagem individual.
 */
export type ContaFinanceira =
  | (ContaPagar & { tipo: "Pagar"; status: StatusContaPagar })
  | (ContaReceber & { tipo: "Receber"; status: StatusContaReceber });

// ================================
// ⚙️ HELPERS OPCIONAIS (para tabelas e relatórios)
// ================================

/** Retorna o ID genérico da conta (independente do tipo) */
export const getIdConta = (conta: ContaFinanceira): number =>
  conta.tipo === "Pagar" ? conta.id_conta_pagar : conta.id_conta_receber;

/** Retorna o nome genérico para status */
export const getStatusConta = (conta: ContaFinanceira): StatusFinanceiro =>
  conta.status;
