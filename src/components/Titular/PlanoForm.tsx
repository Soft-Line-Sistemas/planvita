// PlanoForm.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { Plano } from "@/types/PlanType";
import {
  obterMaiorIdadeParticipantes,
  selecionarPlanosCompativeis,
  selecionarPlanoPorMaiorIdade,
  type ParticipanteMin,
} from "@/utils/planos";
import { fetchSuggestedPlanosWithRetry } from "@/services/planoSuggestion";

export type PlanoFormFields = {
  planoId?: number;
  plano?: Plano | null;
};

interface PlanoFormProps {
  form: UseFormReturn<PlanoFormFields>;
  planoSelecionado: Plano | null;
  participantes: ParticipanteMin[];
  modoCliente?: boolean;
  ignorarComposicaoNaSugestao?: boolean;
}

export function PlanoForm({
  form,
  planoSelecionado,
  participantes,
  modoCliente = false,
  ignorarComposicaoNaSugestao = false,
}: PlanoFormProps) {
  // ----- Helpers -----
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  const idadeMaxToLabel = (idadeMaxima: number | null | undefined) => {
    if (idadeMaxima === null || idadeMaxima === undefined) return "Sem limite";
    if (idadeMaxima >= 999) return "Sem limite";
    return `Até ${idadeMaxima} anos`;
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-semibold text-gray-700 mb-1">{children}</p>
  );

  // Render helpers com coerção defensiva
  const renderBeneficios = (plano?: Plano) => {
    const beneficios = (plano?.beneficios ?? []).filter(Boolean);
    if (beneficios.length === 0) return null;

    return (
      <div className="mt-3">
        <SectionTitle>
          Benefícios inclusos{" "}
          <span className="text-gray-500">({beneficios.length})</span>:
        </SectionTitle>

        <div className="flex flex-wrap gap-2">
          {beneficios.map((b) => (
            <span
              key={`chip-${plano!.id}-${b.id}-${b.nome}`}
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
            >
              {b.nome}
            </span>
          ))}
        </div>

        <ul className="mt-2 list-disc pl-5 space-y-1">
          {beneficios
            .filter((b) => !!b.descricao && b.descricao.trim() !== "")
            .map((b) => (
              <li
                key={`desc-${plano!.id}-${b.id}-${b.nome}`}
                className="text-xs text-gray-600"
              >
                <span className="font-medium">{b.nome}:</span>{" "}
                <span>{b.descricao}</span>
              </li>
            ))}
        </ul>
      </div>
    );
  };

  const renderCoberturas = (plano?: Plano) => {
    const coberturas = (plano?.coberturas ?? []).filter(Boolean);
    if (coberturas.length === 0) return null;

    return (
      <div className="mt-3">
        <SectionTitle>
          Coberturas{" "}
          <span className="text-gray-500">({coberturas.length})</span>:
        </SectionTitle>
        <ul className="list-disc pl-5 space-y-1">
          {coberturas.map((c) => (
            <li
              key={`cov-${plano!.id}-${c.id}`}
              className="text-xs text-gray-600"
            >
              <span className="font-medium">{c.tipo}:</span>{" "}
              <span>{c.descricao}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderBeneficiarios = (plano?: Plano) => {
    const beneficiarios = (plano?.beneficiarios ?? []).filter(Boolean);
    if (beneficiarios.length === 0) return null;

    return (
      <div className="mt-3">
        <SectionTitle>
          Beneficiários contemplados{" "}
          <span className="text-gray-500">({beneficiarios.length})</span>:
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          {beneficiarios.map((b) => (
            <span
              key={`benef-${plano!.id}-${b.id}`}
              className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs text-sky-700"
            >
              {b.nome}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ----- Payload da query -----
  const participantesPayload = useMemo(
    () =>
      participantes.map((p) => ({
        dataNascimento: p.dataNascimento ?? null,
        idade: typeof p.idade === "number" ? p.idade : null,
        parentesco: typeof p.parentesco === "string" ? p.parentesco : undefined,
      })),
    [participantes],
  );
  const enabled =
    participantesPayload.length > 0 &&
    participantesPayload.every((p) =>
      Boolean(p.dataNascimento || p.idade !== null),
    );

  // ----- Query (e “sanitização” dos planos para garantir arrays) -----
  const {
    data: elegiveis,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["planos", "sugerir", participantesPayload, "todos"],
    queryFn: () =>
      fetchSuggestedPlanosWithRetry(participantesPayload, {
        ignorarComposicao: ignorarComposicaoNaSugestao,
      }),
    enabled,
    retry: false,
    staleTime: 60_000,
  });

  // ----- Seleção -----
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const maiorIdadeParticipantes = useMemo(
    () => obterMaiorIdadeParticipantes(participantes),
    [participantes],
  );

  const planosCompativeis = useMemo(() => {
    if (!elegiveis || elegiveis.length === 0) return [];
    if (!modoCliente) return elegiveis;
    return selecionarPlanosCompativeis(elegiveis, participantes);
  }, [elegiveis, modoCliente, participantes]);

  const planosLiberados = useMemo(
    () => new Set<string>(planosCompativeis.map((p) => String(p.id))),
    [planosCompativeis],
  );

  const planoPadrao = useMemo<Plano | null>(() => {
    if (planoSelecionado) return planoSelecionado;
    if (planosCompativeis.length > 0) {
      if (modoCliente) {
        return planosCompativeis[0] ?? null;
      }

      return selecionarPlanoPorMaiorIdade(
        planosCompativeis,
        maiorIdadeParticipantes,
      );
    }
    return null;
  }, [
    planoSelecionado,
    planosCompativeis,
    maiorIdadeParticipantes,
    modoCliente,
  ]);

  useEffect(() => {
    const idStr = planoPadrao?.id != null ? String(planoPadrao.id) : null;
    setSelectedId(idStr);
    if (idStr) {
      form.setValue("planoId", Number(idStr), { shouldDirty: true });
      form.setValue("plano", planoPadrao, { shouldDirty: true });
    } else {
      form.resetField("planoId");
      form.resetField("plano");
    }
  }, [planoPadrao, form]);

  const onSelectPlano = (idStr: string) => {
    setSelectedId(idStr);
    const planoEncontrado =
      planosCompativeis.find((p) => String(p.id) === idStr) || null;
    form.setValue("planoId", Number(idStr), { shouldDirty: true });
    form.setValue("plano", planoEncontrado, { shouldDirty: true });
  };

  // ----- Card de opção -----
  const PlanoOption = ({ plano }: { plano: Plano }) => {
    const idStr = String(plano.id);
    const checked = selectedId === idStr;
    const bloqueado = !planosLiberados.has(idStr);

    return (
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition
        ${checked ? "border-green-600 bg-green-50" : "border-gray-200 hover:bg-gray-50"}
        ${bloqueado ? "opacity-80" : ""}`}
      >
        <input
          type="radio"
          name="plano-escolhido"
          className="mt-1 h-4 w-4 cursor-pointer"
          checked={checked}
          disabled={bloqueado}
          onChange={() => {
            if (bloqueado) return;
            onSelectPlano(idStr);
          }}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">{plano.nome}</h4>
            <span className="text-sm font-medium text-green-700">
              {formatCurrency(plano.valorMensal)}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Faixa etária: {idadeMaxToLabel(plano.idadeMaxima)}
          </p>

          {renderBeneficios(plano)}
          {renderCoberturas(plano)}
          {renderBeneficiarios(plano)}
          {bloqueado && (
            <p className="mt-2 text-xs text-red-600">
              Plano bloqueado para seleção. Em caso de dúvidas, entre em contato
              conosco.
            </p>
          )}
        </div>
      </label>
    );
  };

  return (
    <Card className="border-green-200 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-green-600" />
          <span>Plano selecionado</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {enabled && isLoading && (
          <p className="text-gray-600">Calculando planos elegíveis…</p>
        )}
        {enabled && isError && (
          <p className="text-red-600">
            Não foi possível carregar os planos agora. Revise os dados dos
            participantes e tente novamente.
          </p>
        )}

        {planosCompativeis.length > 0 ? (
          <div className="space-y-3">
            <Label>Planos disponíveis</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planosCompativeis.map((pl) => (
                <PlanoOption key={String(pl.id)} plano={pl} />
              ))}
            </div>
          </div>
        ) : (
          !isLoading && (
            <p className="text-red-600">
              Nenhum plano disponível para os dados informados.
            </p>
          )
        )}

        {/* Participantes */}
        {participantes?.length > 0 && (
          <div>
            <Label>Participantes</Label>
            <ul className="list-disc pl-5">
              {participantes
                .filter((p) => !!p?.nome && p.nome.trim() !== "")
                .map((p, i) => (
                  <li key={i}>{p.nome}</li>
                ))}
            </ul>
          </div>
        )}

        <input type="hidden" {...form.register("planoId")} />
      </CardContent>
    </Card>
  );
}

export default PlanoForm;
