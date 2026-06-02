import { AxiosError } from "axios";

import api from "@/utils/api";
import { Plano } from "@/types/PlanType";
import { sanitizePlanoArray } from "@/utils/planos";

type ParticipantePayload = {
  dataNascimento?: string | null;
  idade?: number | null;
  parentesco?: string | null;
};

const NO_PLAN_MESSAGE = "Nenhum plano elegível encontrado.";
const DEFAULT_ATTEMPTS = 3;
const DEFAULT_DELAY_MS = 250;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const sortPlanos = (planos: Plano[]) =>
  [...planos].sort((a, b) => {
    if (a.valorMensal !== b.valorMensal) {
      return a.valorMensal - b.valorMensal;
    }
    return a.nome.localeCompare(b.nome);
  });

export async function fetchSuggestedPlanosWithRetry(
  participantes: ParticipantePayload[],
  attempts = DEFAULT_ATTEMPTS,
): Promise<Plano[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const resp = await api.post("/plano/sugerir", {
        participantes,
        retornarTodos: true,
      });

      const sanitized = sortPlanos(sanitizePlanoArray(resp.data));
      if (sanitized.length > 0 || attempt === attempts) {
        return sanitized;
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const noPlanFound =
        axiosError.response?.status === 404 &&
        axiosError.response?.data?.message === NO_PLAN_MESSAGE;

      const retriableHttpStatus =
        typeof axiosError.response?.status === "number" &&
        axiosError.response.status >= 500;
      const networkFailure = !axiosError.response;
      const shouldRetry =
        attempt < attempts &&
        (noPlanFound || retriableHttpStatus || networkFailure);

      if (!shouldRetry) {
        if (noPlanFound) {
          return [];
        }
        throw err;
      }

      lastError = err;
    }

    await sleep(DEFAULT_DELAY_MS * attempt);
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}
