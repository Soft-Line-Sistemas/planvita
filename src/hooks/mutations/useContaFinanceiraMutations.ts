import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  baixarContaFinanceira,
  estornarContaFinanceira,
  criarContaFinanceira,
  NovaContaPagarPayload,
  NovaContaReceberPayload,
  reconsultarContaReceber,
  atualizarContaFinanceira,
  deleteContaFinanceira,
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

export const useReconsultarContaReceber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => reconsultarContaReceber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "contas"],
      });
      toast.success("Status atualizado via Asaas");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível reconsultar o status";
      toast.error(message);
    },
  });
};

type AtualizarContaInput = {
  tipo: TipoConta;
  id: number | string;
  payload: Partial<NovaContaPagarPayload | NovaContaReceberPayload>;
};

export const useAtualizarContaFinanceira = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, id, payload }: AtualizarContaInput) =>
      atualizarContaFinanceira(tipo, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "contas"],
      });
      toast.success("Conta atualizada com sucesso");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível atualizar a conta";
      toast.error(message);
    },
  });
};

export const useDeletarContaFinanceira = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, id }: ContaFinanceiraInput) =>
      deleteContaFinanceira(tipo, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "contas"],
      });
      toast.success("Conta excluída com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível excluir a conta");
    },
  });
};
