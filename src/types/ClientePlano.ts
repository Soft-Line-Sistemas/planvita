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
  valorAdicionalMensal?: number;
  valorTotalMensal?: number;
  cobertura: string[];
  observacoes?: string;
}

export interface DependentePlano {
  id: number;
  nome: string;
  dataNascimento?: string | null;
  tipo?: string | null;
  parentesco?: string | null;
  idade?: number | null;
  carenciaRestante?: number | null;
  carenciaDias?: number | null;
  valorAdicionalMensal?: number;
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
}
