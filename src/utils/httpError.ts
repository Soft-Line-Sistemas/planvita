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

export function extractApiError(err: unknown): ApiErrorPayload {
  const axiosError = err as AxiosError<ApiErrorResponse>;
  const data = axiosError?.response?.data;

  if (data && typeof data === "object") {
    return {
      message: data.message ?? "Ocorreu um erro.",
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
