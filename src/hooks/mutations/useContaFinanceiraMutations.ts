import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  baixarContaFinanceira,
  estornarContaFinanceira,
  criarContaFinanceira,
  NovaContaPagarPayload,
  NovaContaReceberPayload,
} from "@/services/financeiro/contas.service";
import { TipoConta } from "@/types/Financeiro";
import { toast } from "sonner";

type ContaFinanceiraInput = {
  tipo: TipoConta;
  id: number | string;
};

export const useBaixarContaFinanceira = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, id }: ContaFinanceiraInput) =>
      baixarContaFinanceira(tipo, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "contas"],
      });
      toast.success("Conta baixada com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível baixar a conta");
    },
  });
};

export const useEstornarContaFinanceira = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, id }: ContaFinanceiraInput) =>
      estornarContaFinanceira(tipo, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "contas"],
      });
      toast.success("Conta estornada com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível estornar a conta");
    },
  });
};

type NovaContaInput = {
  tipo: TipoConta;
  payload: NovaContaPagarPayload | NovaContaReceberPayload;
};

export const useCriarContaFinanceira = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, payload }: NovaContaInput) =>
      criarContaFinanceira(tipo, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "contas"],
      });
      toast.success("Conta criada com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível criar a conta");
    },
  });
};
