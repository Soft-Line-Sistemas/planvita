import { useQuery } from "@tanstack/react-query";
import { fetchMetricasRecorrencia } from "@/services/financeiro/metricas.service";

export const useMetricasRecorrencia = () => {
  return useQuery({
    queryKey: ["financeiro", "metricas", "recorrencia"],
    queryFn: fetchMetricasRecorrencia,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
