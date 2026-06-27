export interface PlanoDetalhado {
  id: string;
  nome: string;
  codigo: string;
  status: "ativo" | "suspenso" | "inativo" | string;
  vigencia: {
    inicio: string;
    fim: string;
  };
  valorMensal: number;
  carenciaDias?: number;
  valorAdicionalMensal?: number;
  valorTotalMensal?: number;
  cobertura: string[];
  observacoes?: string;
}

export interface DependentePlano {
  id: number | string;
  nome: string;
  dataNascimento?: string | null;
  carenciaInicioEm?: string | null;
  tipo?: string | null;
  parentesco?: string | null;
  idade?: number | null;
  carenciaRestante?: number | null;
  carenciaDias?: number | null;
  valorAdicionalMensal?: number;
}

export interface CartaoPagamento {
  last4: string;
  brand: string;
  holderName: string;
}

export interface ClientePlano {
  titularId?: number | string | null;
  tenantSlug?: string | null;
  fotoPerfilUrl?: string | null;
  cpf: string;
  nome: string;
  numeroCarteirinha: string;
  email?: string;
  telefone?: string;
  plano: PlanoDetalhado;
  dependentes?: DependentePlano[];
  pagamentoConfirmadoEm?: string | null;
  assinaturasPendentes?: boolean;
  metodoPagamentoAtual?: "CREDIT_CARD" | "PIX" | "BOLETO" | null;
  cartaoPagamento?: CartaoPagamento | null;
}
