"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  MapPin,
  CreditCard,
  Users,
  Plus,
  Trash2,
  Phone,
  Mail,
} from "lucide-react";
import Image from "next/image";
import logoPlanvita from "@/assets/logo-planvita.png";
import api from "@/utils/api";

import {
  dadosPessoaisSchema,
  enderecoSchema,
  responsavelFinanceiroSchema,
} from "@/components/Titular/schemas";
import { DadosPessoaisForm } from "@/components/Titular/DadosPessoaisForm";
import { EnderecoForm } from "@/components/Titular/EnderecoForm";
import { ResponsavelFinanceiroForm } from "@/components/Titular/ResponsavelFinanceiroForm";
import { DependentesForm } from "@/components/Titular/DependentesForm";
import { Dependente } from "@/types/DependentesType";

export default function CadastroCliente() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [usarMesmosDados, setUsarMesmosDados] = useState(false);

  const steps = [
    { id: 1, title: "Dados pessoais", icon: User },
    { id: 2, title: "Endereço", icon: MapPin },
    { id: 3, title: "Responsável Financeiro", icon: CreditCard },
    { id: 4, title: "Dependentes", icon: Users },
  ];

  const dadosPessoaisForm = useForm({
    resolver: zodResolver(dadosPessoaisSchema),
  });
  const enderecoForm = useForm({ resolver: zodResolver(enderecoSchema) });
  const responsavelForm = useForm({
    resolver: zodResolver(responsavelFinanceiroSchema),
  });

  const handleNext = async () => {
    const form = [dadosPessoaisForm, enderecoForm, responsavelForm][
      currentStep - 1
    ];
    const isValid = await form?.trigger(undefined, { shouldFocus: true });
    if (isValid) {
      setFormData((prev) => ({
        ...prev,
        [`step${currentStep}`]: form.getValues(),
      }));
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () =>
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));

  const handleAddDependente = () =>
    setDependentes([
      ...dependentes,
      { nome: "", idade: null, parentesco: "", telefone: "", cpf: "" },
    ]);

  const handleRemoveDependente = (index: number) =>
    setDependentes(dependentes.filter((_, i) => i !== index));

  const handleDependenteChange = <K extends keyof Dependente>(
    index: number,
    field: K,
    value: Dependente[K],
  ) => {
    const newDeps = [...dependentes];
    newDeps[index][field] = value;
    setDependentes(newDeps);
  };

  const handleFinish = async () => {
    const finalData = { ...formData, dependentes, usarMesmosDados };
    try {
      await api.post("/titular/full", finalData);
      alert("Cadastro realizado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar cadastro");
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 px-4">
      <div className="flex items-center space-x-2 md:space-x-4">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-300
                  ${
                    isActive
                      ? "bg-green-600 border-green-600 text-white shadow-lg scale-110"
                      : isCompleted
                        ? "bg-green-100 border-green-600 text-green-600"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <span className="font-bold text-sm md:text-base">
                    {step.id}
                  </span>
                )}
              </div>

              <div className="ml-2 hidden md:block">
                <p
                  className={`text-sm font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}
                >
                  {step.title}
                </p>
              </div>

              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 md:mx-4 text-gray-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <DadosPessoaisForm form={dadosPessoaisForm} />;
      case 2:
        return <EnderecoForm form={enderecoForm} />;
      case 3:
        return (
          <ResponsavelFinanceiroForm
            form={responsavelForm}
            usarMesmosDados={usarMesmosDados}
            setUsarMesmosDados={setUsarMesmosDados}
          />
        );
      case 4:
        return (
          <DependentesForm
            dependentes={dependentes}
            handleAddDependente={handleAddDependente}
            handleRemoveDependente={handleRemoveDependente}
            handleDependenteChange={handleDependenteChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <Image
            src={logoPlanvita}
            width={120}
            height={60}
            alt="Logo Planvita"
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">
            Cadastro de Cliente
          </h1>
          <p className="text-gray-600 mt-2">
            Preencha os dados do cliente para criar um novo plano
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-green-50 border-b border-green-100">
            <CardTitle className="text-xl text-green-700 flex items-center">
              {(() => {
                const step = steps.find((s) => s.id === currentStep);
                if (step?.icon) {
                  const Icon = step.icon;
                  return <Icon className="w-6 h-6 mr-3" />;
                }
                return null;
              })()}
              {steps.find((s) => s.id === currentStep)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {renderCurrentStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Finalizar Cadastro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
