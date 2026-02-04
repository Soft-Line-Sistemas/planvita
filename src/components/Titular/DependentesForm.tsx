"use client";
import { Dependente } from "@/types/DependentesType";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Users } from "lucide-react";
import { formatCPF, formatPhone } from "@/helpers/formHelpers";
import { calcularIdade } from "@/utils/planos";

interface Props {
  dependentes: Dependente[];
  handleAddDependente: () => void;
  handleRemoveDependente: (index: number) => void;
  handleDependenteChange: <K extends keyof Dependente>(
    index: number,
    field: K,
    value: Dependente[K],
  ) => void;
  canAddDependente?: boolean;
  limiteBeneficiarios?: number | null;
}

export const DependentesForm = ({
  dependentes,
  handleAddDependente,
  handleRemoveDependente,
  handleDependenteChange,
  canAddDependente = true,
  limiteBeneficiarios = null,
}: Props) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Dependentes</h3>
        {limiteBeneficiarios && limiteBeneficiarios > 0 ? (
          <p className="text-xs text-gray-500">
            Limite configurado: {limiteBeneficiarios}
          </p>
        ) : null}
      </div>
      <Button
        onClick={handleAddDependente}
        className="bg-green-600 hover:bg-green-700"
        disabled={!canAddDependente}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar
      </Button>
    </div>
    {!canAddDependente && limiteBeneficiarios && limiteBeneficiarios > 0 ? (
      <p className="text-sm text-red-600">
        Limite de beneficiários atingido para este cadastro.
      </p>
    ) : null}

    {dependentes.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Nenhum dependente adicionado ainda.</p>
        <p className="text-sm">Clique em Adicionar para incluir dependentes.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {dependentes.map((dep, index) => {
          const handleDataNascimentoChange = (value: string) => {
            const normalized = value || null;
            const idadeCalculada = normalized
              ? calcularIdade(normalized)
              : null;
            handleDependenteChange(index, "dataNascimento", normalized);
            handleDependenteChange(index, "idade", idadeCalculada);
          };

          return (
            <Card key={index} className="p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium text-gray-800">
                  Dependente {index + 1}
                </h4>
                <Button
                  onClick={() => handleRemoveDependente(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <Label className="inline-flex items-center gap-1">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={dep.nome}
                    onChange={(e) =>
                      handleDependenteChange(index, "nome", e.target.value)
                    }
                  />
                </div>

                {/* Data de Nascimento */}
                <div>
                  <Label className="inline-flex items-center gap-1">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={dep.dataNascimento ?? ""}
                    onChange={(e) => handleDataNascimentoChange(e.target.value)}
                  />
                </div>

                {/* Parentesco */}
                <div>
                  <Label className="inline-flex items-center gap-1">
                    Parentesco <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={dep.parentesco}
                    onChange={(e) =>
                      handleDependenteChange(
                        index,
                        "parentesco",
                        e.target.value,
                      )
                    }
                  />
                </div>

                {/* Telefone */}
                <div>
                  <Label className="inline-flex items-center gap-1">
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={dep.telefone}
                    onChange={(e) =>
                      handleDependenteChange(
                        index,
                        "telefone",
                        formatPhone(e.target.value),
                      )
                    }
                  />
                </div>

                {/* CPF */}
                <div className="md:col-span-2">
                  <Label className="inline-flex items-center gap-1">
                    CPF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={dep.cpf}
                    onChange={(e) =>
                      handleDependenteChange(
                        index,
                        "cpf",
                        formatCPF ? formatCPF(e.target.value) : e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    )}
  </div>
);
