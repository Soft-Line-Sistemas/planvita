import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import api from "@/utils/api";
import { extractApiError } from "@/utils/httpError";
import {
  dadosPessoaisSchema,
  enderecoSchema,
  responsavelFinanceiroSchema,
} from "@/components/Titular/schemas";
import type { Dependente } from "@/types/DependentesType";
import { useRouter } from "next/navigation";

type Step1Values = z.infer<typeof dadosPessoaisSchema>;
type Step2Values = z.infer<typeof enderecoSchema>;
type Step3Values = z.infer<typeof responsavelFinanceiroSchema>;

type PlanoFormValues = {
  planoId?: number;
};

export type CreateTitularInput = {
  step1?: Step1Values;
  step2?: Step2Values;
  step3?: Step3Values;
  step5?: PlanoFormValues;
  consultorId?: number;
  dependentes: Dependente[];
  usarMesmosDados: boolean;
} & Record<string, unknown>;

export type CreateTitularOutput = unknown;

export function useCreateTitular() {
  const router = useRouter();
  return useMutation<CreateTitularOutput, unknown, CreateTitularInput>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/titular/full", payload);
      return data;
    },
    onError: (err) => {
      const { message, meta } = extractApiError(err);

      toast.error("Não foi possível concluir o cadastro", {
        description: (
          <div className="text-sm">
            <p className="font-medium">{message ?? "Erro ao criar titular."}</p>
            {meta && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {"id" in meta && (
                  <p>
                    <b>ID:</b> {meta.id}
                  </p>
                )}
                {"email" in meta && (
                  <p>
                    <b>E-mail:</b> {meta.email}
                  </p>
                )}
                {"cpf" in meta && (
                  <p>
                    <b>CPF:</b> {meta.cpf ?? "—"}
                  </p>
                )}
              </div>
            )}
          </div>
        ),
        action: meta?.id
          ? {
              label: "Consultar",
              onClick: () => {
                window.location.href = `/cliente`;
              },
            }
          : undefined,
        duration: 6000,
      });
    },
    onSuccess: () => {
      toast.success("Titular criado com sucesso!", {
        description: "Cadastro concluído e vinculado ao plano.",
      });
      router.push("/cliente");
    },
  });
}
