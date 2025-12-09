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
} from "@/types/Notification";

export const useDispararNotificacoesRecorrentes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dispararNotificacoesRecorrentes,
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
    }: {
      titularId: number;
      bloqueado: boolean;
    }) => toggleBloqueioNotificacao(titularId, bloqueado),
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
    }: {
      titularId: number;
      metodo: NotificationChannel;
    }) => atualizarMetodoNotificacao(titularId, metodo),
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
