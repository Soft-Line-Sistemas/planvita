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
  WhatsappOverview,
  WhatsappConnectionStatus,
  WhatsappAutomationConfig,
  WhatsappTestSendResult,
  WhatsappQueuePreview,
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

export const fetchWhatsappOverview = async (): Promise<WhatsappOverview> => {
  const { data } = await api.get<WhatsappOverview>("/notificacoes/whatsapp");
  return data;
};

export const fetchWhatsappQueue = async (
  tipo: NotificationFlow,
): Promise<WhatsappQueuePreview> => {
  const { data } = await api.get<WhatsappQueuePreview>(
    "/notificacoes/whatsapp/queue",
    { params: { tipo } },
  );
  return data;
};

export const fetchWhatsappQr = async (
  refresh = false,
): Promise<WhatsappConnectionStatus> => {
  const { data } = await api.get<WhatsappConnectionStatus>(
    "/notificacoes/whatsapp/qr",
    {
      params: { refresh: refresh ? 1 : 0 },
    },
  );
  return data;
};

export const disconnectWhatsapp = async (): Promise<{ success: boolean }> => {
  const { data } = await api.post<{ success: boolean }>(
    "/notificacoes/whatsapp/disconnect",
  );
  return data;
};

export const updateWhatsappConfig = async (payload: {
  enabled?: boolean;
  useFallbackProvider?: boolean;
  defaultCountryCode?: string;
  timezone?: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  sendOnWeekends?: boolean;
  minIntervalMinutes?: number;
  rules?: Array<{ id: number; enabled?: boolean; title?: string }>;
}): Promise<WhatsappAutomationConfig> => {
  const { data } = await api.put<WhatsappAutomationConfig>(
    "/notificacoes/whatsapp/config",
    payload,
  );
  return data;
};

export const sendWhatsappTest = async (payload: {
  to: string;
  message: string;
}): Promise<WhatsappTestSendResult> => {
  const { data } = await api.post<WhatsappTestSendResult>(
    "/notificacoes/whatsapp/test",
    payload,
  );
  return data;
};
