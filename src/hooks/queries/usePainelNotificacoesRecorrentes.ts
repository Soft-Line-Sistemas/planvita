import { useQuery } from "@tanstack/react-query";
import { fetchPainelNotificacoesRecorrentes } from "@/services/financeiro/notificacoes-recorrentes.service";
import { NotificationFlow } from "@/types/Notification";

export const usePainelNotificacoesRecorrentes = (tipo: NotificationFlow) => {
  return useQuery({
    queryKey: ["financeiro", "notificacoes", "recorrentes", tipo],
    queryFn: () => fetchPainelNotificacoesRecorrentes(tipo),
    staleTime: 30 * 1000,
  });
};
