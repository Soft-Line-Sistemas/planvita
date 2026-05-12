import api from "@/utils/api";

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await api.post("/auth/cliente/change-password", payload);
};
