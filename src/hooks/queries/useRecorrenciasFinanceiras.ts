import { useQuery } from "@tanstack/react-query";
import { fetchRecorrenciasFinanceiras } from "@/services/financeiro/contas.service";

export const useRecorrenciasFinanceiras = () => {
  return useQuery({
    queryKey: ["financeiro", "recorrencias"],
    queryFn: fetchRecorrenciasFinanceiras,
    staleTime: 60 * 1000,
  });
};
