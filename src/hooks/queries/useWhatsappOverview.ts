import { useQuery } from "@tanstack/react-query";
import { fetchWhatsappOverview } from "@/services/financeiro/notificacoes-recorrentes.service";

export const useWhatsappOverview = () => {
  return useQuery({
    queryKey: ["financeiro", "notificacoes", "whatsapp"],
    queryFn: fetchWhatsappOverview,
    staleTime: 15 * 1000,
  });
};
