import { useQuery } from "@tanstack/react-query";
import { fetchLogsNotificacoes } from "@/services/financeiro/notificacoes-recorrentes.service";

export const useLogsNotificacoes = (limit = 50) => {
  return useQuery({
    queryKey: ["financeiro", "notificacoes", "logs", limit],
    queryFn: () => fetchLogsNotificacoes(limit),
    staleTime: 15 * 1000,
  });
};
