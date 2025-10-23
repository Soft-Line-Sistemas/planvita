export type Veiculo = {
  id: number;
  placa: string;
  modelo: string;
  ano: number;
  tipo: string;
  ativo: boolean;
  quilometragemAtual?: number | null;
};
