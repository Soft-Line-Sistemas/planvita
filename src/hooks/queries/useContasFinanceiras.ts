import { useQuery } from "@tanstack/react-query";
import { fetchContasFinanceiras } from "@/services/financeiro/contas.service";

export const useContasFinanceiras = () => {
  return useQuery({
    queryKey: ["financeiro", "contas"],
    queryFn: fetchContasFinanceiras,
    staleTime: 60 * 1000,
  });
};
