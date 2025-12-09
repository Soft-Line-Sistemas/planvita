import { useQuery } from "@tanstack/react-query";
import { listarTemplates } from "@/services/financeiro/notificacoes-recorrentes.service";

export const useTemplatesNotificacoes = () => {
  return useQuery({
    queryKey: ["financeiro", "notificacoes", "templates"],
    queryFn: listarTemplates,
    staleTime: 30 * 1000,
  });
};
