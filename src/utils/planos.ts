// utils/planos.ts
import { Plano } from "@/types/PlanType";

/**
 * Tipo mínimo esperado para um participante (titular ou dependente).
 * Mantemos index signature para aceitar outras propriedades do seu objeto.
 */
export type ParticipanteMin = {
  dataNascimento?: string | null;
  idade?: number | null;
  nome?: string;
  [key: string]: unknown;
};

/** Retorna idade (anos inteiros) a partir de YYYY-MM-DD */
export function calcularIdade(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

/** Recebe array de participantes e retorna a maior idade encontrada */
export function obterMaiorIdadeParticipantes(
  participantes: ParticipanteMin[],
): number | null {
  let maior: number | null = null;

  participantes.forEach((p) => {
    const idadeFromDate = calcularIdade(p.dataNascimento ?? null);
    const idade =
      typeof p.idade === "number" && !isNaN(p.idade) ? p.idade : idadeFromDate;
    if (idade !== null && idade !== undefined) {
      if (maior === null || idade > maior) maior = idade;
    }
  });

  return maior;
}

/**
 * Seleciona o plano apropriado com base na maior idade entre participantes.
 * Regras:
 * 1) Se existir plano com idadeMaxima === null => retorna esse (prioridade).
 * 2) Senão, retorna o primeiro plano cuja idadeMaxima >= idadeMaximaParticipantes (menor idadeMaxima que cubra).
 * 3) Se nenhum cobrir, retorna o plano com maior idadeMaxima (fallback).
 */
export function selecionarPlanoPorMaiorIdade(
  planos: Plano[],
  idadeMaximaParticipantes: number | null,
): Plano | null {
  if (!planos || planos.length === 0) return null;

  // Prioriza plano sem limite
  const planoSemLimite = planos.find((p) => p.idadeMaxima === null);
  if (planoSemLimite) return planoSemLimite;

  // Se não temos idade, devolve plano com maior idadeMaxima
  if (idadeMaximaParticipantes === null) {
    return planos.reduce((prev, cur) => {
      const prevVal = prev.idadeMaxima ?? -Infinity;
      const curVal = cur.idadeMaxima ?? -Infinity;
      return prevVal > curVal ? prev : cur;
    });
  }

  // Filtra planos que cobrem a idade e escolhe o de menor idadeMaxima (ex: 60 em vez de 80)
  const planosQueCobrem = planos.filter(
    (p) =>
      typeof p.idadeMaxima === "number" &&
      p.idadeMaxima >= idadeMaximaParticipantes,
  );
  if (planosQueCobrem.length > 0) {
    return planosQueCobrem.reduce((prev, cur) => {
      // escolhe o menor idadeMaxima entre os que cobrem
      return prev.idadeMaxima! <= cur.idadeMaxima! ? prev : cur;
    });
  }

  // Fallback: maior idadeMaxima disponível
  return planos.reduce((prev, cur) => {
    const prevVal = prev.idadeMaxima ?? -Infinity;
    const curVal = cur.idadeMaxima ?? -Infinity;
    return prevVal > curVal ? prev : cur;
  });
}
