import api from "@/utils/api";

export type AssinaturaDigital = {
  [x: string]: string | number | Date;
  id: number;
  titularId: number;
  tipo: string;
  arquivoId: string;
  arquivoUrl: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export const listarAssinaturas = async (): Promise<AssinaturaDigital[]> => {
  const { data } = await api.get<AssinaturaDigital[]>(
    "/titular/me/assinaturas",
  );
  return data;
};

export const salvarAssinatura = async (payload: {
  tipo: string;
  assinaturaBase64: string;
}): Promise<AssinaturaDigital> => {
  const { data } = await api.post<AssinaturaDigital>(
    "/titular/me/assinaturas",
    payload,
  );
  return data;
};
