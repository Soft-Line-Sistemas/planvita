import api from "@/utils/api";

export type ChangeClientePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type FotoPerfilPayload = {
  imageBase64: string;
  filename?: string;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
};

export type FotoPerfilResponse = {
  id: number;
  titularId: number;
  arquivoUrl: string;
  dataUpload: string;
};

export const alterarSenhaCliente = async (
  payload: ChangeClientePasswordPayload,
): Promise<void> => {
  await api.post("/auth/cliente/change-password", payload);
};

export const salvarFotoPerfilCliente = async (
  payload: FotoPerfilPayload,
): Promise<FotoPerfilResponse> => {
  const { data } = await api.post<FotoPerfilResponse>(
    "/titular/me/foto",
    payload,
  );
  return data;
};

export const removerFotoPerfilCliente = async (): Promise<void> => {
  await api.delete("/titular/me/foto");
};
