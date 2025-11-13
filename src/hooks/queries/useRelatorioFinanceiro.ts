import { useQuery } from "@tanstack/react-query";
import { fetchRelatorioFinanceiro } from "@/services/financeiro/relatorio.service";

export const useRelatorioFinanceiro = () => {
  return useQuery({
    queryKey: ["financeiro", "relatorios"],
    queryFn: fetchRelatorioFinanceiro,
    staleTime: 60 * 1000,
  });
};
