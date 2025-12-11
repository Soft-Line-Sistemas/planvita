import { useQuery } from "@tanstack/react-query";
import { fetchLogsNotificacoes } from "@/services/financeiro/notificacoes-recorrentes.service";
import { NotificationFlow } from "@/types/Notification";

export const useLogsNotificacoes = (limit = 50, tipo?: NotificationFlow) => {
  return useQuery({
    queryKey: ["financeiro", "notificacoes", "logs", limit, tipo ?? "todos"],
    queryFn: () => fetchLogsNotificacoes(limit, tipo),
    staleTime: 15 * 1000,
  });
};
