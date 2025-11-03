"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Plano } from "@/types/PlanType";
import { Button } from "../ui/button";

interface ParticipanteMin {
  nome?: string;
  idade?: number;
  dataNascimento?: string | null;
  [key: string]: unknown;
}

interface ConfirmacaoProps {
  dados: {
    titular: ParticipanteMin;
    dependentes?: ParticipanteMin[];
    planoSelecionado?: Plano | null;
    [key: string]: unknown;
  };
}

export function Confirmacao({ dados }: ConfirmacaoProps) {
  const { titular, dependentes = [], planoSelecionado } = dados;

  return (
    <Card className="border-green-200 shadow-md">
      <CardHeader>
        <CardTitle>Confirmação de Cadastro</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
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
              <strong>Data de Nascimento:</strong> {titular.dataNascimento}
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
                  {dep.dataNascimento ? ` (Nasc: ${dep.dataNascimento})` : ""}
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
              {planoSelecionado.valorMensal.toFixed(2)}
            </p>
            <p>
              <strong>Idade Máxima:</strong>{" "}
              {planoSelecionado.idadeMaxima === null
                ? "Sem limite"
                : `${planoSelecionado.idadeMaxima} anos`}
            </p>
            <p>
              <strong>Beneficiários:</strong>{" "}
              {planoSelecionado.beneficiarios.join(", ")}
            </p>
          </div>
        ) : (
          <p className="text-red-600 font-medium">
            Nenhum plano disponível para a faixa etária dos participantes.
          </p>
        )}
      </CardContent>
      <Button
        variant="success"
        className="mt-4 w-full"
        // onClick={handleSubmit(onSubmit)}
      >
        <CheckCircle className="mr-2" />
        Confirmar Cadastro
      </Button>
    </Card>
  );
}

export default Confirmacao;
