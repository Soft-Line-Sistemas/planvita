import api from "@/utils/api";
import {
  NotificationPanel,
  NotificationFireResult,
  UpdateSchedulePayload,
  NotificationRecipient,
  NotificationChannel,
  NotificationLogEntry,
  NotificationTemplate,
  NotificationFlow,
} from "@/types/Notification";

export const fetchPainelNotificacoesRecorrentes = async (
  tipo: NotificationFlow = "pendencia-periodica",
): Promise<NotificationPanel> => {
  const { data } = await api.get<NotificationPanel>(
    "/notificacoes/recorrentes/painel",
    { params: { tipo } },
  );
  return data;
};

export const dispararNotificacoesRecorrentes = async (
  tipo: NotificationFlow = "pendencia-periodica",
): Promise<NotificationFireResult> => {
  const { data } = await api.post<NotificationFireResult>(
    "/notificacoes/recorrentes/disparar",
    {},
    { params: { tipo } },
  );
  return data;
};

export const atualizarAgendamentoNotificacao = async (
  payload: UpdateSchedulePayload,
) => {
  const { data } = await api.patch(
    "/notificacoes/recorrentes/agendamento",
    payload,
  );
  return data;
};

export const toggleBloqueioNotificacao = async (
  titularId: number,
  bloqueado: boolean,
  tipo: NotificationFlow = "pendencia-periodica",
): Promise<NotificationRecipient> => {
  const { data } = await api.patch<NotificationRecipient>(
    `/notificacoes/recorrentes/clientes/${titularId}/bloqueio`,
    { bloqueado },
    { params: { tipo } },
  );
  return data;
};

export const atualizarMetodoNotificacao = async (
  titularId: number,
  metodo: NotificationChannel,
  tipo: NotificationFlow = "pendencia-periodica",
): Promise<NotificationRecipient> => {
  const { data } = await api.patch<NotificationRecipient>(
    `/notificacoes/recorrentes/clientes/${titularId}/metodo`,
    { metodo },
    { params: { tipo } },
  );
  return data;
};

export const fetchLogsNotificacoes = async (
  limit = 50,
  tipo?: NotificationFlow,
): Promise<NotificationLogEntry[]> => {
  const { data } = await api.get<NotificationLogEntry[]>(
    `/notificacoes/recorrentes/logs`,
    {
      params: { limit, tipo },
    },
  );
  return Array.isArray(data) ? data : [];
};

export const listarTemplates = async (
  flow?: NotificationFlow,
): Promise<NotificationTemplate[]> => {
  const { data } = await api.get<NotificationTemplate[]>(
    "/notificacoes/templates",
    {
      params: { flow },
    },
  );
  return Array.isArray(data) ? data : [];
};

export const criarTemplate = async (
  payload: Partial<NotificationTemplate>,
): Promise<NotificationTemplate> => {
  const { data } = await api.post<NotificationTemplate>(
    "/notificacoes/templates",
    payload,
  );
  return data;
};

export const atualizarTemplate = async (
  id: number,
  payload: Partial<NotificationTemplate>,
): Promise<NotificationTemplate> => {
  const { data } = await api.put<NotificationTemplate>(
    `/notificacoes/templates/${id}`,
    payload,
  );
  return data;
};

export const removerTemplate = async (id: number) => {
  await api.delete(`/notificacoes/templates/${id}`);
};

export const uploadAnexoTemplate = async (params: {
  fileBase64: string;
  filename: string;
  mimeType: string;
}): Promise<{ url: string }> => {
  const { data } = await api.post<{ url: string }>(
    "/notificacoes/templates/upload",
    params,
  );
  return data;
};
