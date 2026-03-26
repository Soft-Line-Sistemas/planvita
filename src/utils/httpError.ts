import { AxiosError } from "axios";

type ApiErrorMetaValue = string | number | boolean | null | undefined;

export type ApiErrorPayload = {
  message?: string;
  code?: string;
  meta?: Record<string, ApiErrorMetaValue>;
};

type ApiErrorResponse = {
  message?: string;
  code?: string;
  meta?: Record<string, ApiErrorMetaValue>;
};

function normalizeValidationMessage(message?: string): string {
  if (!message) return "Ocorreu um erro.";

  const normalized = message.trim();
  if (normalized.length === 0) return "Ocorreu um erro.";

  const lowerMessage = normalized.toLowerCase();

  if (
    lowerMessage.includes("invalid input: expected string, received undefined")
  ) {
    return "Preencha os campos obrigatórios antes de continuar.";
  }

  if (
    lowerMessage.includes(
      'invalid option: expected one of "masculino"|"feminino"',
    )
  ) {
    return "Selecione uma opção válida para o campo Sexo.";
  }

  return normalized;
}

export function extractApiError(err: unknown): ApiErrorPayload {
  const axiosError = err as AxiosError<ApiErrorResponse>;
  const data = axiosError?.response?.data;

  if (data && typeof data === "object") {
    return {
      message: normalizeValidationMessage(data.message),
      code: data.code,
      meta: data.meta,
    };
  }

  const fallbackMessage =
    typeof axiosError?.message === "string"
      ? axiosError.message
      : "Erro inesperado.";

  return { message: fallbackMessage };
}
