import { useQuery } from "@tanstack/react-query";
import {
  AsaasPaymentListParams,
  listAsaasPayments,
} from "@/services/financeiro/asaas.service";

export const useAsaasPayments = (params?: AsaasPaymentListParams) => {
  return useQuery({
    queryKey: ["financeiro", "asaas", params],
    queryFn: () => listAsaasPayments(params),
    staleTime: 60 * 1000,
  });
};
