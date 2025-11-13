import { useQuery } from "@tanstack/react-query";
import { fetchClienteById } from "@/services/cliente.service";
import { Cliente } from "@/types/ClientType";

export const useClienteDetalhes = (id?: string) => {
  return useQuery<Cliente, Error>({
    queryKey: ["cliente-detalhes", id],
    queryFn: () => {
      if (!id) {
        throw new Error("ID do cliente não informado");
      }
      return fetchClienteById(id);
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
};
