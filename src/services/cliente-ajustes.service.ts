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

export const alterarSenhaCliente = async (
  payload: ChangeClientePasswordPayload,
): Promise<void> => {
  await api.post("/auth/cliente/change-password", payload);
};

export const salvarFotoPerfilCliente = async (payload: FotoPerfilPayload) => {
  const { data } = await api.post("/titular/me/foto", payload);
  return data;
};

export const removerFotoPerfilCliente = async (): Promise<void> => {
  await api.delete("/titular/me/foto");
};
