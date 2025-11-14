"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import {
  Check,
  CreditCard,
  MapPin,
  PlaneIcon,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import logoPlanvita from "@/assets/logo-planvita.png";

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
import { PlanoForm } from "@/components/Titular/PlanoForm";
import { Confirmacao } from "@/components/Titular/Confirmacao";
import { calcularIdade, type ParticipanteMin } from "@/utils/planos";
import {
  useCreateTitular,
  type CreateTitularInput,
} from "@/hooks/mutations/useCreateTitular";

type CadastroClienteWizardVariant = "dashboard" | "public";

interface CadastroClienteWizardProps {
  variant?: CadastroClienteWizardVariant;
}

type Step1Values = z.infer<typeof dadosPessoaisSchema>;
type Step2Values = z.infer<typeof enderecoSchema>;
type Step3Values = z.infer<typeof responsavelFinanceiroSchema>;
type PlanoFormValues = {
  planoId?: number;
};

interface WizardStepsData {
  step1?: Step1Values;
  step2?: Step2Values;
  step3?: Step3Values;
  step5?: PlanoFormValues;
  [key: string]: unknown;
}

export function CadastroClienteWizard({
  variant = "dashboard",
}: CadastroClienteWizardProps) {
  const isPublic = variant === "public";

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardStepsData>({});
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [usarMesmosDados, setUsarMesmosDados] = useState(false);
  const { mutateAsync, isPending } = useCreateTitular();
  const steps = [
    { id: 1, title: "Dados pessoais", icon: User },
    { id: 2, title: "Endereço", icon: MapPin },
    { id: 3, title: "Responsável Financeiro", icon: CreditCard },
    { id: 4, title: "Dependentes", icon: Users },
    { id: 5, title: "Plano", icon: PlaneIcon },
    { id: 6, title: "Confirmação", icon: Check },
  ];

  const dadosPessoaisForm = useForm<Step1Values>({
    resolver: zodResolver(dadosPessoaisSchema),
  });
  const enderecoForm = useForm<Step2Values>({
    resolver: zodResolver(enderecoSchema),
  });
  const responsavelForm = useForm<Step3Values>({
    resolver: zodResolver(responsavelFinanceiroSchema),
  });
  const planoForm = useForm<PlanoFormValues>();

  const persistStepData = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1: {
        const isValid = await dadosPessoaisForm.trigger(undefined, {
          shouldFocus: true,
        });
        if (!isValid) return false;
        setFormData((prev) => ({
          ...prev,
          step1: dadosPessoaisForm.getValues(),
        }));
        return true;
      }
      case 2: {
        const isValid = await enderecoForm.trigger(undefined, {
          shouldFocus: true,
        });
        if (!isValid) return false;
        setFormData((prev) => ({
          ...prev,
          step2: enderecoForm.getValues(),
        }));
        return true;
      }
      case 3: {
        const isValid = await responsavelForm.trigger(undefined, {
          shouldFocus: true,
        });
        if (!isValid) return false;
        setFormData((prev) => ({
          ...prev,
          step3: responsavelForm.getValues(),
        }));
        return true;
      }
      case 5: {
        const isValid = await planoForm.trigger(undefined, {
          shouldFocus: true,
        });
        if (!isValid) return false;
        setFormData((prev) => ({
          ...prev,
          step5: planoForm.getValues(),
        }));
        return true;
      }
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const canProceed = await persistStepData();
    if (!canProceed) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () =>
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));

  const handleAddDependente = () =>
    setDependentes((prev) => [
      ...prev,
      {
        nome: "",
        idade: null,
        dataNascimento: null,
        parentesco: "",
        telefone: "",
        cpf: "",
      },
    ]);

  const handleRemoveDependente = (index: number) =>
    setDependentes((prev) => prev.filter((_, i) => i !== index));

  const handleDependenteChange = <K extends keyof Dependente>(
    index: number,
    field: K,
    value: Dependente[K],
  ) => {
    setDependentes((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleFinish = async () => {
    const step1Data = formData.step1 ?? dadosPessoaisForm.getValues();
    const step2Data = formData.step2 ?? enderecoForm.getValues();
    const step3Data = formData.step3 ?? responsavelForm.getValues();
    const step5Data = formData.step5 ?? planoForm.getValues();

    const payload: CreateTitularInput = {
      ...formData,
      step1: step1Data,
      step2: step2Data,
      step3: { ...step3Data, usarMesmosDados },
      step5: step5Data,
      dependentes,
      usarMesmosDados,
    };

    await mutateAsync(payload);
  };

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center px-4">
      <div className="flex items-center gap-2 md:gap-4">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex size-10 md:size-12 aspect-square shrink-0 items-center justify-center rounded-full border-2 transition-transform duration-300
                  ${
                    isActive
                      ? "scale-110 border-green-600 bg-green-600 text-white shadow-lg"
                      : isCompleted
                        ? "border-green-600 bg-green-100 text-green-600"
                        : "border-gray-300 bg-gray-100 text-gray-400"
                  }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 md:h-6 md:w-6 leading-none" />
                ) : (
                  <span className="text-sm font-bold md:text-base leading-none">
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
                <ChevronRight className="mx-2 h-4 w-4 text-gray-400 md:mx-4 shrink-0" />
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

      case 5: {
        const titularData = formData.step1 ?? dadosPessoaisForm.getValues();

        const participantesList: ParticipanteMin[] = [
          {
            nome: titularData?.nomeCompleto ?? "",
            dataNascimento: titularData?.dataNascimento ?? null,
          },
          ...dependentes.map<ParticipanteMin>((d) => ({
            nome: d.nome,
            dataNascimento: d.dataNascimento ?? null,
            idade:
              typeof d.idade === "number" && !Number.isNaN(d.idade)
                ? d.idade
                : calcularIdade(d.dataNascimento ?? null),
          })),
        ];

        return (
          <PlanoForm
            form={planoForm}
            planoSelecionado={null}
            participantes={participantesList}
          />
        );
      }

      case 6: {
        const titularData = formData.step1 ?? dadosPessoaisForm.getValues();
        const titularResumo: ParticipanteMin = {
          nome: titularData?.nomeCompleto ?? "",
          dataNascimento: titularData?.dataNascimento ?? null,
        };

        const dependentesResumo: ParticipanteMin[] = dependentes.map((d) => ({
          nome: d.nome,
          dataNascimento: d.dataNascimento ?? null,
          idade:
            typeof d.idade === "number" && !Number.isNaN(d.idade)
              ? d.idade
              : calcularIdade(d.dataNascimento ?? null),
        }));

        return (
          <Confirmacao
            dados={{
              titular: titularResumo,
              dependentes: dependentesResumo,
            }}
          />
        );
      }
      default:
        return null;
    }
  };

  const headingTitle = isPublic
    ? "Cadastre-se na Planvita"
    : "Cadastro de Cliente";

  const headingSubtitle = isPublic
    ? "Complete os passos abaixo para contratar o seu plano Planvita de forma rápida e segura."
    : "Preencha os dados do cliente para criar um novo plano.";

  const containerClasses = isPublic
    ? "min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 py-10 md:py-16"
    : "min-h-screen bg-gray-50 py-8";

  return (
    <div className={containerClasses}>
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <Image
            src={logoPlanvita}
            width={isPublic ? 140 : 120}
            height={isPublic ? 70 : 60}
            alt="Logo Planvita"
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-green-700 md:text-3xl">
            {headingTitle}
          </h1>
          <p className="mt-2 text-gray-600">{headingSubtitle}</p>
        </div>

        {renderStepIndicator()}

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-green-100 bg-green-50">
            <CardTitle className="flex items-center text-xl text-green-700">
              {(() => {
                const step = steps.find((s) => s.id === currentStep);
                if (step?.icon) {
                  const Icon = step.icon;
                  return <Icon className="mr-3 h-6 w-6" />;
                }
                return null;
              })()}
              {steps.find((s) => s.id === currentStep)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {renderCurrentStep()}

            <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
              <Button
                type="button"
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  Continuar <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={isPending}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  {isPending ? "Finalizando..." : "Finalizar Cadastro"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
