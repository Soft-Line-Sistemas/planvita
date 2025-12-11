import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  atualizarAgendamentoNotificacao,
  dispararNotificacoesRecorrentes,
  toggleBloqueioNotificacao,
  atualizarMetodoNotificacao,
  criarTemplate,
  atualizarTemplate,
  removerTemplate,
} from "@/services/financeiro/notificacoes-recorrentes.service";
import {
  NotificationChannel,
  NotificationTemplate,
  NotificationFlow,
} from "@/types/Notification";

export const useDispararNotificacoesRecorrentes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tipo?: NotificationFlow) =>
      dispararNotificacoesRecorrentes(tipo ?? "pendencia-periodica"),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "notificacoes", "recorrentes"],
      }),
  });
};

export const useAtualizarAgendamentoNotificacao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: atualizarAgendamentoNotificacao,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "notificacoes", "recorrentes"],
      }),
  });
};

export const useToggleBloqueioNotificacao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      titularId,
      bloqueado,
      tipo,
    }: {
      titularId: number;
      bloqueado: boolean;
      tipo?: NotificationFlow;
    }) => toggleBloqueioNotificacao(titularId, bloqueado, tipo),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "notificacoes", "recorrentes"],
      }),
  });
};

export const useAtualizarMetodoNotificacao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      titularId,
      metodo,
      tipo,
    }: {
      titularId: number;
      metodo: NotificationChannel;
      tipo?: NotificationFlow;
    }) => atualizarMetodoNotificacao(titularId, metodo, tipo),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "notificacoes", "recorrentes"],
      }),
  });
};

export const useCriarTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarTemplate,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "notificacoes", "templates"],
      }),
  });
};

export const useAtualizarTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<NotificationTemplate>;
    }) => atualizarTemplate(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "notificacoes", "templates"],
      }),
  });
};

export const useRemoverTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => removerTemplate(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "notificacoes", "templates"],
      }),
  });
};
