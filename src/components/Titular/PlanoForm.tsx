// PlanoForm.tsx
"use client";
import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { Plano } from "@/types/PlanType";

interface PlanoFormProps {
  form: UseFormReturn;
  planoSelecionado: Plano | null;
  participantes: Array<{
    dataNascimento?: string | null;
    idade?: number | null;
    nome?: string;
  }>;
  campoPlanoId?: string;
}

export function PlanoForm({
  form,
  planoSelecionado,
  participantes,
  campoPlanoId = "planoId",
}: PlanoFormProps) {
  // Preenche o form com o plano selecionado assim que mudar
  useEffect(() => {
    if (planoSelecionado) {
      form.setValue(campoPlanoId, planoSelecionado.id);
      // Só seta campos extras se existirem no seu schema (não altere nomes do banco)
      // ex.: form.setValue("valorMensal", planoSelecionado.valorMensal);
    }
  }, [planoSelecionado, form, campoPlanoId]);

  return (
    <Card className="border-green-200 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-green-600" />
          <span>Plano selecionado automaticamente</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {planoSelecionado ? (
          <>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-700">
                {planoSelecionado.nome}
              </h3>
              <p className="text-sm text-gray-600">
                Valor Mensal: R$ {planoSelecionado.valorMensal.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Idade Máxima:{" "}
                {planoSelecionado.idadeMaxima === null
                  ? "Sem limite"
                  : `${planoSelecionado.idadeMaxima} anos`}
              </p>
            </div>

            <div>
              <Label>Participantes</Label>
              <ul className="list-disc pl-5">
                {participantes.map((p, i) => (
                  <li key={i}>{p.nome ?? `Participante ${i + 1}`}</li>
                ))}
              </ul>
            </div>

            {/* campo oculto para envio */}
            <input type="hidden" {...form.register(campoPlanoId)} />
          </>
        ) : (
          <p className="text-red-600">
            Nenhum plano disponível para essa faixa etária.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PlanoForm;
