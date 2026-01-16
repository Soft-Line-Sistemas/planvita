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
  cobertura: string[];
  observacoes?: string;
}

export interface DependentePlano {
  id: number;
  nome: string;
  dataNascimento?: string | null;
  tipo?: string | null;
}

export interface ClientePlano {
  titularId?: number | string | null;
  cpf: string;
  nome: string;
  numeroCarteirinha: string;
  email?: string;
  telefone?: string;
  plano: PlanoDetalhado;
  dependentes?: DependentePlano[];
}
