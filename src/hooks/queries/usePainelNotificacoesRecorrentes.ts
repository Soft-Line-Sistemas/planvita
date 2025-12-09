import { useQuery } from "@tanstack/react-query";
import { fetchPainelNotificacoesRecorrentes } from "@/services/financeiro/notificacoes-recorrentes.service";

export const usePainelNotificacoesRecorrentes = () => {
  return useQuery({
    queryKey: ["financeiro", "notificacoes", "recorrentes"],
    queryFn: fetchPainelNotificacoesRecorrentes,
    staleTime: 30 * 1000,
  });
};
