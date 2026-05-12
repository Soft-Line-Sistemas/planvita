import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";
import { Cliente } from "@/types/ClientType";
import type { Plano } from "@/types/PlanType";

interface ClientesApiResponse {
  data: Cliente[];
  total: number;
  page: number;
  totalPages: number;
}

export const useClientes = (params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  plano?: string;
  enabled?: boolean;
}) => {
  return useQuery<ClientesApiResponse, Error>({
    queryKey: ["clientes", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        search: params.search || "",
        status: params.status || "todos",
        plano: params.plano || "todos",
      });

      const response = await api.get(`/titular?${queryParams.toString()}`);
      const payload = response.data as ClientesApiResponse;
      if (Array.isArray(payload?.data)) {
        const buildPlanoFallback = (id: string, nome: string): Plano => ({
          id,
          nome,
          valorMensal: 0,
          idadeMaxima: null,
          coberturaMaxima: 0,
          carenciaDias: 0,
          vigenciaMeses: 12,
          ativo: false,
          totalClientes: 0,
          receitaMensal: 0,
          assistenciaFuneral: 0,
          auxilioCemiterio: null,
          taxaInclusaCemiterioPublico: false,
          coberturas: [],
          beneficios: [],
          beneficiarios: [],
        });

        payload.data = payload.data.map((cliente) => {
          if (cliente.plano?.id) return cliente;
          const planoBasico =
            params.plano && params.plano !== "todos"
              ? buildPlanoFallback(params.plano, params.plano)
              : buildPlanoFallback("sem-plano", "Sem plano");

          return {
            ...cliente,
            plano: planoBasico,
          };
        });
      }
      return payload;
    },
    staleTime: 1000 * 60, // 1 minuto
    enabled: params.enabled ?? true,
  });
};
