import api from "@/utils/api";

export interface MetricasRecorrenciaDTO {
  mrr: number;
  revenueOneTime: number;
  churnRate: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
}

export const fetchMetricasRecorrencia =
  async (): Promise<MetricasRecorrenciaDTO> => {
    const { data } = await api.get<MetricasRecorrenciaDTO>(
      "/financeiro/metricas/recorrencia",
    );
    return data;
  };
