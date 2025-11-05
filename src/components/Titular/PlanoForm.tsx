// PlanoForm.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import api from "@/utils/api";
import { Plano } from "@/types/PlanType";
import { sanitizePlanoArray, type ParticipanteMin } from "@/utils/planos";

type PlanoFormFields = {
  planoId?: number;
};

interface PlanoFormProps {
  form: UseFormReturn<PlanoFormFields>;
  planoSelecionado: Plano | null;
  participantes: ParticipanteMin[];
}

export function PlanoForm({
  form,
  planoSelecionado,
  participantes,
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
    return `${idadeMaxima} anos`;
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
        nome: p.nome ?? undefined,
      })),
    [participantes],
  );
  const enabled = participantesPayload.length > 0;

  // ----- Query (e “sanitização” dos planos para garantir arrays) -----
  const {
    data: elegiveis,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["planos", "sugerir", participantesPayload, "todos"],
    queryFn: async () => {
      const resp = await api.post("/plano/sugerir", {
        participantes: participantesPayload,
        retornarTodos: true,
      });

      const sanitized = sanitizePlanoArray(resp.data);

      sanitized.sort((a, b) => {
        if (a.valorMensal !== b.valorMensal)
          return a.valorMensal - b.valorMensal;
        return a.nome.localeCompare(b.nome);
      });

      return sanitized;
    },
    enabled,
    staleTime: 60_000,
  });

  // ----- Seleção -----
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const planoPadrao = useMemo<Plano | null>(() => {
    if (planoSelecionado) return planoSelecionado;
    if (elegiveis && elegiveis.length > 0) return elegiveis[0];
    return null;
  }, [planoSelecionado, elegiveis]);

  useEffect(() => {
    const idStr = planoPadrao?.id != null ? String(planoPadrao.id) : null;
    setSelectedId(idStr);
    if (idStr) {
      form.setValue("planoId", Number(idStr), { shouldDirty: true });
    } else {
      form.resetField("planoId");
    }
  }, [planoPadrao, form]);

  const onSelectPlano = (idStr: string) => {
    setSelectedId(idStr);
    form.setValue("planoId", Number(idStr), { shouldDirty: true });
  };

  // ----- Card de opção -----
  const PlanoOption = ({ plano }: { plano: Plano }) => {
    const idStr = String(plano.id);
    const checked = selectedId === idStr;

    return (
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition
        ${checked ? "border-green-600 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}
      >
        <input
          type="radio"
          name="plano-escolhido"
          className="mt-1 h-4 w-4 cursor-pointer"
          checked={checked}
          onChange={() => onSelectPlano(idStr)}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">{plano.nome}</h4>
            <span className="text-sm font-medium text-green-700">
              {formatCurrency(plano.valorMensal)}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Idade Máxima: {idadeMaxToLabel(plano.idadeMaxima)}
          </p>

          {renderBeneficios(plano)}
          {renderCoberturas(plano)}
          {renderBeneficiarios(plano)}
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
            Falha ao obter planos:{" "}
            {error instanceof Error ? error.message : "erro inesperado"}
          </p>
        )}

        {planoPadrao && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-lg font-semibold text-green-700">
              Plano sugerido
            </h3>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800">{planoPadrao.nome}</p>
                <p className="text-xs text-gray-600">
                  Idade Máxima: {idadeMaxToLabel(planoPadrao.idadeMaxima)}
                </p>
              </div>
              <p className="text-sm font-medium text-green-700">
                {formatCurrency(planoPadrao.valorMensal)}
              </p>
            </div>

            {renderBeneficios(planoPadrao)}
            {renderCoberturas(planoPadrao)}
            {renderBeneficiarios(planoPadrao)}
          </div>
        )}

        {elegiveis && elegiveis.length > 0 ? (
          <div className="space-y-3">
            <Label>Outras opções de planos</Label>
            <div className="space-y-2">
              {elegiveis.map((pl) => (
                <PlanoOption key={String(pl.id)} plano={pl} />
              ))}
            </div>
          </div>
        ) : (
          !isLoading && (
            <p className="text-red-600">
              Nenhum plano disponível para essa faixa etária.
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
