import { useQuery } from "@tanstack/react-query";
import { listarPagamentos } from "@/services/financeiro/pagamentos.service";

export const usePagamentos = () => {
  return useQuery({
    queryKey: ["financeiro", "pagamentos"],
    queryFn: listarPagamentos,
    staleTime: 60 * 1000,
  });
};
