import { useQuery } from "@tanstack/react-query";
import { buscarClientesFinanceiro } from "@/services/financeiro/clientes.service";

export const useFinanceiroClientes = (search: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["clientes", "financeiro", search],
    queryFn: () => buscarClientesFinanceiro(search, 25),
    enabled,
    staleTime: 60 * 1000,
  });
};
