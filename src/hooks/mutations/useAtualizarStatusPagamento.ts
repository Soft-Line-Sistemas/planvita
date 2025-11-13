import { useMutation, useQueryClient } from "@tanstack/react-query";
import { atualizarStatusPagamento } from "@/services/financeiro/pagamentos.service";
import { Pagamento, StatusPagamento } from "@/types/PaymentType";
import { toast } from "sonner";

type AtualizarStatusInput = {
  id: number | string;
  status: StatusPagamento;
  dataPagamento?: string | null;
};

export const useAtualizarStatusPagamento = () => {
  const queryClient = useQueryClient();

  return useMutation<Pagamento, unknown, AtualizarStatusInput>({
    mutationFn: ({ id, ...payload }: AtualizarStatusInput) =>
      atualizarStatusPagamento(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "pagamentos"],
      });
      toast.success("Pagamento atualizado com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível atualizar o pagamento");
    },
  });
};
