import { useQuery } from "@tanstack/react-query";
import { listarTemplates } from "@/services/financeiro/notificacoes-recorrentes.service";
import { NotificationFlow } from "@/types/Notification";

export const useTemplatesNotificacoes = (flow?: NotificationFlow) => {
  return useQuery({
    queryKey: ["financeiro", "notificacoes", "templates", flow ?? "all"],
    queryFn: () => listarTemplates(flow),
    staleTime: 30 * 1000,
  });
};
