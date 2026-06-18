import { useQuery } from "@tanstack/react-query";
import { fetchWhatsappQueue } from "@/services/financeiro/notificacoes-recorrentes.service";
import { NotificationFlow } from "@/types/Notification";

export const useWhatsappQueue = (tipo: NotificationFlow) => {
  return useQuery({
    queryKey: ["financeiro", "notificacoes", "whatsapp", "queue", tipo],
    queryFn: () => fetchWhatsappQueue(tipo),
    staleTime: 15 * 1000,
  });
};
