export interface Dependente {
  id?: string;
  nome: string;
  idade: number | null;
  dataNascimento?: string | null;
  carenciaInicioEm?: string | null;
  parentesco: string;
  parentescoNormalizado?: string;
  telefone: string;
  cpf: string;
  foraGradeFamiliar?: boolean;
  excluirCobrancaAdicional?: boolean;
  valorAdicionalMensal?: number;
  carenciaRestante?: number;
  carenciaDias?: number;
}
