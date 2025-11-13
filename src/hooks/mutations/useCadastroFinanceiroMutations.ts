import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBancoFinanceiro,
  deleteBancoFinanceiro,
  createTipoContabilFinanceiro,
  deleteTipoContabilFinanceiro,
  createFormaPagamentoFinanceira,
  deleteFormaPagamentoFinanceira,
  createCentroResultadoFinanceiro,
  deleteCentroResultadoFinanceiro,
} from "@/services/financeiro/cadastros.service";
import { CADASTROS_QUERY_KEY } from "@/hooks/queries/useFinanceiroCadastros";

const useInvalidateCadastros = () => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: CADASTROS_QUERY_KEY,
    });
};

export const useCreateBancoFinanceiro = () => {
  const invalidate = useInvalidateCadastros();
  return useMutation({
    mutationFn: createBancoFinanceiro,
    onSuccess: invalidate,
  });
};

export const useDeleteBancoFinanceiro = () => {
  const invalidate = useInvalidateCadastros();
  return useMutation({
    mutationFn: deleteBancoFinanceiro,
    onSuccess: invalidate,
  });
};

export const useCreateTipoContabilFinanceiro = () => {
  const invalidate = useInvalidateCadastros();
  return useMutation({
    mutationFn: createTipoContabilFinanceiro,
    onSuccess: invalidate,
  });
};

export const useDeleteTipoContabilFinanceiro = () => {
  const invalidate = useInvalidateCadastros();
  return useMutation({
    mutationFn: deleteTipoContabilFinanceiro,
    onSuccess: invalidate,
  });
};

export const useCreateFormaPagamentoFinanceira = () => {
  const invalidate = useInvalidateCadastros();
  return useMutation({
    mutationFn: createFormaPagamentoFinanceira,
    onSuccess: invalidate,
  });
};

export const useDeleteFormaPagamentoFinanceira = () => {
  const invalidate = useInvalidateCadastros();
  return useMutation({
    mutationFn: deleteFormaPagamentoFinanceira,
    onSuccess: invalidate,
  });
};

export const useCreateCentroResultadoFinanceiro = () => {
  const invalidate = useInvalidateCadastros();
  return useMutation({
    mutationFn: createCentroResultadoFinanceiro,
    onSuccess: invalidate,
  });
};

export const useDeleteCentroResultadoFinanceiro = () => {
  const invalidate = useInvalidateCadastros();
  return useMutation({
    mutationFn: deleteCentroResultadoFinanceiro,
    onSuccess: invalidate,
  });
};
