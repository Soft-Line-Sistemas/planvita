"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plano } from "@/types/PlanType";
import { User, Users, Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDatePtBr } from "@/utils/date";
import { ParticipanteMin } from "@/utils/planos";

interface ConfirmacaoProps {
  dados: {
    titular: ParticipanteMin;
    dependentes?: ParticipanteMin[];
    planoSelecionado?: Plano | null;
    consultor?: { name: string };
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
        { id: selectedConsultorId as number, nome: `Consultor #${selectedConsultorId}` },
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

        <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-5">
          <Label htmlFor="consultor-select" className="text-sm font-semibold text-emerald-800">
            Consultor Responsável <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select
              value={selectedValue}
              onValueChange={(value) =>
                onSelectConsultor(
                  value === "campo-do-bosque" ? "campo-do-bosque" : Number(value),
                )
              }
              disabled={isConsultorLocked || isLoadingConsultores}
            >
              <SelectTrigger id="consultor-select" className="w-full sm:max-w-md bg-white border-emerald-200">
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
              <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                Bloqueado via link
              </span>
            )}
          </div>
          {consultorError && (
            <p className="text-xs font-medium text-red-600">{consultorError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Titular */}
          <Card className="border-green-100 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2 text-green-700">
                <User className="w-4 h-4" />
                Titular
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-gray-500">Nome:</span> <br/><span className="font-medium text-gray-900">{titular.nome}</span></p>
              <div className="grid grid-cols-2 gap-2">
                {titular.idade !== undefined && (
                  <p><span className="text-gray-500">Idade:</span> <br/><span className="font-medium text-gray-900">{titular.idade} anos</span></p>
                )}
                {titular.dataNascimento && (
                  <p><span className="text-gray-500">Nascimento:</span> <br/><span className="font-medium text-gray-900">{formatDateBr(titular.dataNascimento)}</span></p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dependentes */}
          <Card className="border-blue-100 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2 text-blue-700">
                <Users className="w-4 h-4" />
                Dependentes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {dependentes.length > 0 ? (
                <ul className="space-y-3">
                  {dependentes.map((dep, i) => (
                    <li key={i} className="border-b last:border-0 pb-2 last:pb-0">
                      <p className="font-medium text-gray-900 leading-tight">{dep.nome}</p>
                      <p className="text-xs text-gray-500">
                        {dep.idade !== undefined ? `${dep.idade} anos` : ""}
                        {dep.dataNascimento ? ` • ${formatDateBr(dep.dataNascimento)}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">Nenhum dependente</p>
              )}
            </CardContent>
          </Card>

          {/* Plano Selecionado */}
          {planoSelecionado ? (
            <Card className="border-amber-100 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2 text-amber-700">
                  <Shield className="w-4 h-4" />
                  Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="text-xs text-amber-600 font-bold uppercase">{planoSelecionado.nome}</p>
                  <p className="text-xl font-bold text-gray-900">
                    R$ {planoSelecionado.valorMensal.toFixed(2)}
                    <span className="text-xs font-normal text-gray-500"> /mês</span>
                  </p>
                </div>
                
                <div className="pt-2 border-t border-amber-100">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Resumo</p>
                  <p className="text-xs text-gray-700">
                    Idade Máxima: {planoSelecionado.idadeMaxima === null ? "Livre" : `${planoSelecionado.idadeMaxima} anos`}
                  </p>
                  {planoSelecionado.beneficiarios && planoSelecionado.beneficiarios.length > 0 && (
                    <p className="text-xs text-gray-700 mt-1">
                      Beneficiários: {planoSelecionado.beneficiarios.map(b => b.nome).join(", ")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : planoSelecionado === null ? (
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
              <p className="text-red-600 text-sm font-medium text-center">
                Atenção: Nenhum plano elegível para este perfil.
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default Confirmacao;
