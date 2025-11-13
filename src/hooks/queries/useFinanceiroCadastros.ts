import { useQuery } from "@tanstack/react-query";
import { fetchFinanceiroCadastros } from "@/services/financeiro/cadastros.service";

export const CADASTROS_QUERY_KEY = ["financeiro", "cadastros"];

export const useFinanceiroCadastros = () => {
  return useQuery({
    queryKey: CADASTROS_QUERY_KEY,
    queryFn: fetchFinanceiroCadastros,
    staleTime: 60 * 1000,
  });
};
