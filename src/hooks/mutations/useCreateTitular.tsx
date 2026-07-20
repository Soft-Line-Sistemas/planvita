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
import type { Plano } from "@/types/PlanType";
import { useRouter } from "next/navigation";

type Step1Values = z.infer<typeof dadosPessoaisSchema>;
type Step2Values = z.infer<typeof enderecoSchema>;
type Step3Values = z.infer<typeof responsavelFinanceiroSchema>;

type PlanoFormValues = {
  planoId?: number;
  plano?: Plano | null;
  billingType?: "PIX" | "BOLETO" | "CREDIT_CARD";
  creditCard?: {
    holderName: string;
    holderCpf: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
};

export type CreateTitularInput = {
  consents?: {
    privacyPolicyAccepted?: boolean;
    privacyPolicyVersion?: string | null;
    serviceContractAccepted?: boolean;
    serviceContractVersion?: string | null;
    origin?: string | null;
  };
  step1?: Step1Values;
  step2?: Step2Values;
  step3?: Step3Values;
  step5?: PlanoFormValues;
  consultorId?: number;
  consultorCodigo?: string;
  consultorTenantId?: string;
  targetTenantId?: string;
  servicosAdicionais?: string[];
  dependentes: Dependente[];
  usarMesmosDados: boolean;
} & Record<string, unknown>;

export type CreateTitularOutput = unknown;

export function useCreateTitular(options?: {
  variant?: "dashboard" | "public";
}) {
  const router = useRouter();
  return useMutation<CreateTitularOutput, unknown, CreateTitularInput>({
    mutationFn: async (payload) => {
      const endpoint =
        options?.variant === "public" ? "/auth/register" : "/titular/full";
      const { targetTenantId, ...requestBody } = payload;
      const { data } = await api.post(endpoint, requestBody, {
        ...(options?.variant === "public" && targetTenantId
          ? {
              headers: { "X-Tenant": targetTenantId },
              params: { tenant: targetTenantId },
            }
          : {}),
      });
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
    onSuccess: (_data, variables) => {
      const data = _data as
        | {
            paymentPending?: boolean;
            message?: string;
            recurring?: {
              status?: "configured" | "failed" | "skipped";
              message?: string;
            };
          }
        | undefined;
      const paymentPending = data?.paymentPending === true;
      const recurringMessage = data?.recurring?.message?.trim();
      const recurringFailed = data?.recurring?.status === "failed";

      if (options?.variant === "public") {
        toast.success("Cadastro concluído!", {
          description: paymentPending
            ? data?.message?.trim() ||
              "Verifique o SMS ou Email para acessar a cobranca e concluir o pagamento."
            : recurringMessage && recurringFailed
              ? `Agora valide seu acesso e crie sua senha. ${recurringMessage}`
              : "Agora valide seu acesso (código) e crie sua senha para entrar.",
        });

        if (paymentPending) {
          const loginHint =
            variables.step1?.email?.trim() ||
            variables.step1?.cpf?.trim() ||
            "";
          const params = new URLSearchParams();
          params.set("modo", "pagamento-pendente");
          if (loginHint) params.set("login", loginHint);
          router.push(`/cliente?${params.toString()}`);
          return;
        }

        const loginHint =
          variables.step1?.email?.trim() || variables.step1?.cpf?.trim() || "";
        const params = new URLSearchParams();
        params.set("modo", "primeiro-acesso");
        if (loginHint) params.set("login", loginHint);
        router.push(`/cliente?${params.toString()}`);
        return;
      }

      toast.success("Titular criado com sucesso!", {
        description:
          recurringMessage && recurringFailed
            ? `Cadastro concluído e vinculado ao plano. ${recurringMessage}`
            : "Cadastro concluído e vinculado ao plano.",
      });
      router.push("/painel/cliente");
    },
  });
}
