export type ParceriaCategoria = {
  id: number;
  nome: string;
  slug: string;
  icone?: string | null;
};

export type ParceriaParceiroResumo = {
  id: number;
  nome: string;
  slug: string;
  logoUrl?: string | null;
  cidade?: string | null;
  uf?: string | null;
};

export type ParceriaVantagemResumo = {
  id: number;
  slug: string;
  titulo: string;
  descricaoCurta?: string | null;
  tipo: string;
  valorDesconto?: number | null;
  validadeFim?: string | null;
  destaque: boolean;
  elegivel: boolean;
  motivoBloqueio?: string | null;
  categoria?: ParceriaCategoria | null;
  parceiro: ParceriaParceiroResumo;
};

export type ParceriaVantagemDetalhe = ParceriaVantagemResumo & {
  descricaoCompleta?: string | null;
  regrasUso?: string | null;
  instrucoesResgate?: string | null;
  codigoCupom?: string | null;
  linkResgate?: string | null;
  whatsapp?: string | null;
};
