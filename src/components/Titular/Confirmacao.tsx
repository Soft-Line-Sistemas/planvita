"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plano } from "@/types/PlanType";
import { User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDatePtBr } from "@/utils/date";

interface ParticipanteMin {
  nome?: string;
  idade?: number | null;
  dataNascimento?: string | null;
  [key: string]: unknown;
}

interface ConfirmacaoProps {
  dados: {
    titular: ParticipanteMin;
    dependentes?: ParticipanteMin[];
    planoSelecionado?: Plano | null;
    consultor?: { name: string };
    [key: string]: unknown;
  };
  consultores: Array<{ id: number; nome: string }>;
  selectedConsultorId?: number | "campo-do-bosque";
  onSelectConsultor: (consultorId: number | "campo-do-bosque") => void;
  isConsultorLocked?: boolean;
  isLoadingConsultores?: boolean;
  consultorError?: string | null;
}

export function Confirmacao({
  dados,
  consultores,
  selectedConsultorId,
  onSelectConsultor,
  isConsultorLocked = false,
  isLoadingConsultores = false,
  consultorError = null,
}: ConfirmacaoProps) {
  const { titular, dependentes = [], planoSelecionado, consultor } = dados;
  const valorAdicionalPadrao = 14.9;

  const normalizarTexto = (value?: string | null) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const canonicalizarParentesco = (value?: string | null) => {
    const normalized = normalizarTexto(value);
    if (!normalized) return "outro";

    const relacoes: Record<string, string[]> = {
      titular: [
        "titular",
        "responsavel",
        "responsavel financeiro",
        "contratante",
      ],
      conjuge: [
        "conjuge",
        "esposa",
        "esposo",
        "marido",
        "companheira",
        "companheiro",
      ],
      filho: ["filho", "filha", "enteado", "enteada", "crianca", "menor"],
      pai: ["pai", "genitor", "padrasto", "sogro"],
      mae: ["mae", "genitora", "madrasta", "sogra"],
      irmao: ["irmao", "irma"],
      neto: ["neto", "neta", "bisneto", "bisneta"],
      sobrinho: ["sobrinho", "sobrinha"],
      outro: ["outro", "outra", "agregado", "sem parentesco"],
    };

    for (const [canonico, variacoes] of Object.entries(relacoes)) {
      if (
        variacoes.some(
          (item) => normalized === item || normalized.includes(item),
        )
      ) {
        return canonico;
      }
    }

    return "outro";
  };

  const pertenceAGrade = (
    parentesco?: string | null,
    beneficiarios: string[] = [],
  ) => {
    if (beneficiarios.length === 0) return true;
    const dep = canonicalizarParentesco(parentesco);

    return beneficiarios.some((beneficiario) => {
      const b = normalizarTexto(beneficiario);
      const canonical = canonicalizarParentesco(beneficiario);
      if (canonical === dep) return true;

      if (b.includes("pai e mae") || b.includes("mae e pai")) {
        return dep === "pai" || dep === "mae";
      }
      if (b.includes("filhos e netos")) {
        return dep === "filho" || dep === "neto";
      }
      if (b.includes("neto e bisnetos")) {
        return dep === "neto";
      }
      if (b.includes("sobrinhos ate 50 anos")) {
        return dep === "sobrinho";
      }
      if (b.includes("esposo a ate 55 anos")) {
        return dep === "conjuge";
      }
      return false;
    });
  };

  const resumoMensalidade = useMemo(() => {
    const base = Number(planoSelecionado?.valorMensal ?? 0);
    if (!planoSelecionado) return { base, adicional: 0, total: base };

    const beneficiariosPlano = (planoSelecionado.beneficiarios ?? []).map(
      (item) => item.nome,
    );
    const adicional = dependentes.reduce((acc, dep) => {
      const foraGrade = !pertenceAGrade(
        String(dep.parentesco ?? ""),
        beneficiariosPlano,
      );
      return foraGrade ? acc + valorAdicionalPadrao : acc;
    }, 0);

    return {
      base,
      adicional,
      total: base + adicional,
    };
  }, [dependentes, planoSelecionado]);

  const selectedValue =
    selectedConsultorId === "campo-do-bosque"
      ? "campo-do-bosque"
      : typeof selectedConsultorId === "number"
        ? selectedConsultorId.toString()
        : undefined;
  const consultorSelecionadoNoLink =
    typeof selectedConsultorId === "number" &&
    !consultores.some((item) => item.id === selectedConsultorId);
  const consultoresDisponiveis = consultorSelecionadoNoLink
    ? [
        ...consultores,
        { id: selectedConsultorId, nome: `Consultor #${selectedConsultorId}` },
      ]
    : consultores;

  const formatDateBr = (value?: string | null) => {
    if (!value) return null;
    return formatDatePtBr(value);
  };

  return (
    <Card className="border-green-200 shadow-md">
      <CardHeader>
        <CardTitle>Confirmação de Cadastro</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Consultor Responsável */}
        {consultor && (
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-4 py-2">
            <User className="w-5 h-5 text-green-600" />
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
              <User className="w-4 h-4" /> Consultor: {consultor.name}
            </span>
          </div>
        )}

        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
          <Label htmlFor="consultor-select" className="text-sm font-medium">
            Consultor <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedValue}
            onValueChange={(value) =>
              onSelectConsultor(
                value === "campo-do-bosque" ? "campo-do-bosque" : Number(value),
              )
            }
            disabled={isConsultorLocked || isLoadingConsultores}
          >
            <SelectTrigger id="consultor-select" className="w-full bg-white">
              <SelectValue
                placeholder={
                  isLoadingConsultores
                    ? "Carregando consultores..."
                    : "Selecione um consultor"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="campo-do-bosque">Campo do Bosque</SelectItem>
              {consultoresDisponiveis.map((consultorItem) => (
                <SelectItem
                  key={consultorItem.id}
                  value={consultorItem.id.toString()}
                >
                  {consultorItem.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isConsultorLocked && (
            <p className="text-xs text-gray-600">
              Consultor definido pelo link de indicação e bloqueado para edição.
            </p>
          )}
          {consultorError && (
            <p className="text-xs font-medium text-red-600">{consultorError}</p>
          )}
        </div>

        {/* Titular */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700">Titular</h3>
          <p>
            <strong>Nome:</strong> {titular.nome}
          </p>
          {titular.idade !== undefined && (
            <p>
              <strong>Idade:</strong> {titular.idade} anos
            </p>
          )}
          {titular.dataNascimento && (
            <p>
              <strong>Data de Nascimento:</strong>{" "}
              {formatDateBr(titular.dataNascimento)}
            </p>
          )}
        </div>

        {/* Dependentes */}
        {dependentes.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700">Dependentes</h3>
            <ul className="list-disc pl-5">
              {dependentes.map((dep, i) => (
                <li key={i}>
                  {dep.nome}{" "}
                  {dep.idade !== undefined ? `- ${dep.idade} anos` : ""}
                  {dep.dataNascimento
                    ? ` (Nasc: ${formatDateBr(dep.dataNascimento)})`
                    : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Plano Selecionado */}
        {planoSelecionado ? (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-700">
              Plano Selecionado
            </h3>
            <p>
              <strong>Nome:</strong> {planoSelecionado.nome}
            </p>
            <p>
              <strong>Valor Mensal:</strong> R${" "}
              {resumoMensalidade.total.toFixed(2)}
            </p>
            {resumoMensalidade.adicional > 0 ? (
              <p className="text-sm text-gray-600">
                Base: R$ {resumoMensalidade.base.toFixed(2)} + R${" "}
                {resumoMensalidade.adicional.toFixed(2)} de adicional
              </p>
            ) : null}
            <p>
              <strong>Idade Máxima:</strong>{" "}
              {planoSelecionado.idadeMaxima === null
                ? "Sem limite"
                : `${planoSelecionado.idadeMaxima} anos`}
            </p>
            {planoSelecionado.beneficiarios &&
              planoSelecionado.beneficiarios.length > 0 && (
                <p>
                  <strong>Beneficiários:</strong>{" "}
                  {planoSelecionado.beneficiarios
                    .map((beneficiario) => beneficiario.nome)
                    .join(", ")}
                </p>
              )}
          </div>
        ) : planoSelecionado === null ? (
          <p className="text-red-600 font-medium">
            Nenhum plano disponível para a faixa etária dos participantes.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default Confirmacao;
