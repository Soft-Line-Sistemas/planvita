import { useQuery } from "@tanstack/react-query";
import api from "@/utils/api";
import { Cliente } from "@/types/ClientType";

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
      return response.data as ClientesApiResponse;
    },
    staleTime: 1000 * 60, // 1 minuto
  });
};
