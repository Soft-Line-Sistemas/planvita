"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
import { Card, CardContent } from "@/components/ui/card";
import logoPlanvita from "@/assets/logo-planvita.png";

import {
  dadosPessoaisSchema,
  enderecoSchema,
  responsavelFinanceiroSchema,
} from "@/components/Titular/schemas";
import { DadosPessoaisForm } from "@/components/Titular/DadosPessoaisForm";
import { EnderecoForm } from "@/components/Titular/EnderecoForm";
import { ResponsavelFinanceiroForm } from "@/components/Titular/ResponsavelFinanceiroForm";
import { Plano } from "@/types/PlanType";
import {
  DependentesForm,
  type DependenteFieldErrors,
} from "@/components/Titular/DependentesForm";
import { RELATIONSHIP_OPTIONS } from "@/constants/relationshipOptions";
import { Dependente } from "@/types/DependentesType";
import { PlanoForm } from "@/components/Titular/PlanoForm";
import { Confirmacao } from "@/components/Titular/Confirmacao";
import { calcularIdade, type ParticipanteMin } from "@/utils/planos";
import {
  useCreateTitular,
  type CreateTitularInput,
} from "@/hooks/mutations/useCreateTitular";
import api from "@/utils/api";

type CadastroClienteWizardVariant = "dashboard" | "public";

interface CadastroClienteWizardProps {
  variant?: CadastroClienteWizardVariant;
}
const MAX_DEPENDENTES_POR_TITULAR = 8;
const RESPONSAVEL_FINANCEIRO_CONTA_NO_PLANO = new Set<string>(["Cônjuge"]);

type Step1Values = z.infer<typeof dadosPessoaisSchema>;
type Step2Values = z.infer<typeof enderecoSchema>;
type Step3Values = z.infer<typeof responsavelFinanceiroSchema>;
type PlanoFormValues = {
  planoId?: number;
  plano?: Plano | null;
};

export interface TypedWizardStepsData {
  step1?: Step1Values;
  step2?: Step2Values;
  step3?: Step3Values & { usarMesmosDados?: boolean };
  dependentes?: Dependente[];
  step5?: PlanoFormValues;
}

interface ConsultorOption {
  id: number;
  nome: string;
  tenantId: string;
  tenantLabel: string;
  selectionKey: string;
}

export function CadastroClienteWizard({
  variant = "dashboard",
}: CadastroClienteWizardProps) {
  const isPublic = variant === "public";
  const [consultorFromQuery, setConsultorFromQuery] = useState<{
    id: number;
    tenantId?: string;
  } | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TypedWizardStepsData>({});
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [dependentesErrors, setDependentesErrors] = useState<
    DependenteFieldErrors[]
  >([]);
  const [limiteBeneficiarios, setLimiteBeneficiarios] = useState<number | null>(
    null,
  );
  const [usarMesmosDados, setUsarMesmosDados] = useState(false);
  const [consultores, setConsultores] = useState<ConsultorOption[]>([]);
  const [isLoadingConsultores, setIsLoadingConsultores] = useState(true);
  const [consultorError, setConsultorError] = useState<string | null>(null);
  const [selectedConsultorKey, setSelectedConsultorKey] = useState<
    string | undefined
  >();
  const { mutateAsync, isPending } = useCreateTitular({ variant });
  const steps = [
    { id: 1, title: "Dados pessoais", icon: User },
    { id: 2, title: "Endereço", icon: MapPin },
    { id: 3, title: "Responsável Financeiro", icon: CreditCard },
    { id: 4, title: "Dependentes", icon: Users },
    { id: 5, title: "Plano", icon: PlaneIcon },
    { id: 6, title: "Confirmação", icon: Check },
  ];

  const dadosPessoaisForm = useForm<Step1Values>({
    resolver: zodResolver(dadosPessoaisSchema) as Resolver<Step1Values>,
  });
  const enderecoForm = useForm<Step2Values>({
    resolver: zodResolver(enderecoSchema) as Resolver<Step2Values>,
  });
  const responsavelForm = useForm<Step3Values>({
    resolver: zodResolver(responsavelFinanceiroSchema) as Resolver<Step3Values>,
  });
  const planoForm = useForm<PlanoFormValues>();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const consultorIdParam = params.get("consultorId");
    const consultorTenantParam = params.get("consultorTenant");
    const consultorId = consultorIdParam ? Number(consultorIdParam) : undefined;
    if (consultorId && Number.isFinite(consultorId) && consultorId > 0) {
      setConsultorFromQuery({
        id: consultorId,
        tenantId: consultorTenantParam?.trim().toLowerCase() || undefined,
      });
    }
  }, [isPublic]);

  const buildDependenteErrors = (dep: Dependente): DependenteFieldErrors => {
    const errors: DependenteFieldErrors = {};
    const nome = String(dep.nome ?? "").trim();
    const dataNascimento = String(dep.dataNascimento ?? "").trim();
    const parentesco = String(dep.parentesco ?? "").trim();
    const telefoneDigits = String(dep.telefone ?? "").replace(/\D/g, "");
    const cpfDigits = String(dep.cpf ?? "").replace(/\D/g, "");

    if (!nome) errors.nome = "Nome do dependente é obrigatório";
    else if (nome.length > 1000)
      errors.nome = "Nome do dependente deve ter no máximo 1000 caracteres";
    if (!dataNascimento)
      errors.dataNascimento = "Data de nascimento é obrigatória";
    if (!parentesco) errors.parentesco = "Parentesco é obrigatório";
    else if (parentesco.length > 1000)
      errors.parentesco = "Parentesco deve ter no máximo 1000 caracteres";
    else if (!RELATIONSHIP_OPTIONS.includes(parentesco as never)) {
      errors.parentesco = "Selecione um parentesco válido";
    }
    if (telefoneDigits && telefoneDigits.length < 10) {
      errors.telefone = "Telefone inválido";
    }
    if (cpfDigits && cpfDigits.length < 11) {
      errors.cpf = "CPF inválido";
    }

    return errors;
  };

  const validateDependentes = (items: Dependente[]) => {
    const errors = items.map(buildDependenteErrors);
    const isValid = errors.every((err) => Object.keys(err).length === 0);
    return { isValid, errors };
  };

  useEffect(() => {
    let ativo = true;
    setIsLoadingConsultores(true);
    api
      .get("/consultor/public", {
        params: isPublic ? { scope: "global" } : undefined,
      })
      .then((res) => {
        if (!ativo) return;
        const data = Array.isArray(res.data) ? res.data : [];
        const options = data
          .map((item) => ({
            id: Number(item?.id),
            nome: String(item?.nome ?? "").trim(),
            tenantId: String(item?.tenantId ?? "")
              .trim()
              .toLowerCase(),
            tenantLabel: String(item?.tenantLabel ?? "").trim(),
            selectionKey: String(item?.selectionKey ?? "").trim(),
          }))
          .filter(
            (item) =>
              Number.isFinite(item.id) &&
              item.id > 0 &&
              item.nome.length > 0 &&
              item.tenantId.length > 0 &&
              item.selectionKey.length > 0,
          );

        setConsultores(options);
      })
      .catch(() => {
        if (!ativo) return;
        setConsultores([]);
      })
      .finally(() => {
        if (ativo) setIsLoadingConsultores(false);
      });

    return () => {
      ativo = false;
    };
  }, [isPublic]);

  useEffect(() => {
    if (!consultorFromQuery || consultores.length === 0) return;
    const matched =
      (consultorFromQuery.tenantId
        ? consultores.find(
            (item) =>
              item.id === consultorFromQuery.id &&
              item.tenantId === consultorFromQuery.tenantId,
          )
        : undefined) ??
      consultores.find((item) => item.id === consultorFromQuery.id);
    if (!matched) return;
    setSelectedConsultorKey(matched.selectionKey);
    setConsultorError(null);
  }, [consultorFromQuery, consultores]);

  useEffect(() => {
    if (consultorFromQuery) return;
    if (selectedConsultorKey) return;
    if (isLoadingConsultores) return;
    setSelectedConsultorKey(consultores[0]?.selectionKey);
  }, [
    consultorFromQuery,
    consultores,
    isLoadingConsultores,
    selectedConsultorKey,
  ]);

  useEffect(() => {
    let ativo = true;
    api
      .get("/regras")
      .then((res) => {
        if (!ativo) return;
        const regra = Array.isArray(res.data) ? res.data[0] : null;
        const limite = Number(regra?.limiteBeneficiarios);
        if (Number.isFinite(limite) && limite > 0) {
          setLimiteBeneficiarios(Math.min(limite, MAX_DEPENDENTES_POR_TITULAR));
        } else {
          setLimiteBeneficiarios(MAX_DEPENDENTES_POR_TITULAR);
        }
      })
      .catch(() => {
        if (ativo) setLimiteBeneficiarios(MAX_DEPENDENTES_POR_TITULAR);
      });

    return () => {
      ativo = false;
    };
  }, []);

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
      case 4: {
        const { isValid, errors } = validateDependentes(dependentes);
        setDependentesErrors(errors);
        if (!isValid) return false;
        setFormData((prev) => ({
          ...prev,
          dependentes,
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

  const handleAddDependente = () => {
    const limiteAtual = limiteBeneficiarios ?? MAX_DEPENDENTES_POR_TITULAR;
    const vagasConsumidasCorresponsavel = usarMesmosDados ? 0 : 1;
    if (
      limiteAtual > 0 &&
      dependentes.length + vagasConsumidasCorresponsavel >= limiteAtual
    ) {
      return;
    }
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
    setDependentesErrors((prev) => [...prev, {}]);
  };

  const handleRemoveDependente = (index: number) => {
    setDependentes((prev) => prev.filter((_, i) => i !== index));
    setDependentesErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDependenteChange = <K extends keyof Dependente>(
    index: number,
    field: K,
    value: Dependente[K],
  ) => {
    setDependentes((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      const { errors } = validateDependentes(updated);
      setDependentesErrors(errors);
      return updated;
    });
  };

  const podeAdicionarDependente =
    dependentes.length + (usarMesmosDados ? 0 : 1) <
    (limiteBeneficiarios ?? MAX_DEPENDENTES_POR_TITULAR);
  const canContinueStep4 =
    currentStep !== 4 || validateDependentes(dependentes).isValid;

  const handleFinish = async () => {
    if (!selectedConsultorKey) {
      setConsultorError("Selecione o consultor para vincular este cliente.");
      return;
    }
    const consultorSelecionado = consultores.find(
      (item) => item.selectionKey === selectedConsultorKey,
    );
    if (!consultorSelecionado) {
      setConsultorError("Consultor selecionado não foi encontrado.");
      return;
    }

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
      consultorId: consultorSelecionado.id,
      consultorTenantId: consultorSelecionado.tenantId,
      targetTenantId: isPublic ? consultorSelecionado.tenantId : undefined,
    };

    await mutateAsync(payload);
  };

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center">
      <div className="w-full rounded-2xl border border-[#D5D5D5] bg-white px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 lg:gap-4">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex size-8 sm:size-9 md:size-10 lg:size-12 aspect-square shrink-0 items-center justify-center rounded-full border-2 transition-transform duration-300
                  ${
                    isActive
                      ? "scale-110 border-green-600 bg-green-600 text-white shadow-lg"
                      : isCompleted
                        ? "border-green-600 bg-green-100 text-green-600"
                        : "border-[#DFDFDF] bg-[#DFDFDF] text-white"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 md:h-6 md:w-6 leading-none" />
                  ) : (
                    <span className="text-xs font-bold md:text-sm lg:text-base leading-none">
                      {step.id}
                    </span>
                  )}
                </div>

                <div className="ml-2 hidden xl:block">
                  <p
                    className={`text-sm font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}
                  >
                    {step.title}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <ChevronRight className="mx-1 h-3 w-3 text-gray-400 md:mx-2 md:h-4 md:w-4 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    return (
      <div key={currentStep} className="animate-slide-left">
        {(() => {
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
                  dependentesErrors={dependentesErrors}
                  handleAddDependente={handleAddDependente}
                  handleRemoveDependente={handleRemoveDependente}
                  handleDependenteChange={handleDependenteChange}
                  canAddDependente={podeAdicionarDependente}
                  limiteBeneficiarios={limiteBeneficiarios}
                />
              );

            case 5: {
              const titularData =
                formData.step1 ?? dadosPessoaisForm.getValues();
              const parentescoResponsavel = String(
                responsavelForm.getValues("parentesco") ?? "",
              ).trim();
              const incluirResponsavelNaComposicaoPlano =
                !usarMesmosDados &&
                RESPONSAVEL_FINANCEIRO_CONTA_NO_PLANO.has(
                  parentescoResponsavel,
                );

              const participantesList: ParticipanteMin[] = [
                {
                  nome: titularData?.nomeCompleto ?? "",
                  dataNascimento: titularData?.dataNascimento ?? null,
                  parentesco: "Titular",
                },
                ...(incluirResponsavelNaComposicaoPlano
                  ? [
                      {
                        nome: responsavelForm.getValues("nomeCompleto") ?? "",
                        dataNascimento:
                          responsavelForm.getValues("dataNascimento") ?? null,
                        parentesco: parentescoResponsavel || "Outro",
                      } satisfies ParticipanteMin,
                    ]
                  : []),
                ...dependentes.map<ParticipanteMin>((d) => ({
                  nome: d.nome,
                  dataNascimento: d.dataNascimento ?? null,
                  parentesco: d.parentesco ?? "Outro",
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
                  modoCliente={isPublic}
                  ignorarComposicaoNaSugestao
                />
              );
            }

            case 6: {
              const titularData =
                formData.step1 ?? dadosPessoaisForm.getValues();
              const titularResumo: ParticipanteMin = {
                nome: titularData?.nomeCompleto ?? "",
                dataNascimento: titularData?.dataNascimento ?? null,
              };

              const dependentesResumo: ParticipanteMin[] = dependentes.map(
                (d) => ({
                  nome: d.nome,
                  dataNascimento: d.dataNascimento ?? null,
                  idade:
                    typeof d.idade === "number" && !Number.isNaN(d.idade)
                      ? d.idade
                      : calcularIdade(d.dataNascimento ?? null),
                }),
              );

              return (
                <Confirmacao
                  dados={{
                    titular: titularResumo,
                    dependentes: dependentesResumo,
                    planoSelecionado: planoForm.getValues().plano,
                  }}
                  consultores={consultores}
                  selectedConsultorKey={selectedConsultorKey}
                  onSelectConsultor={(consultorKey) => {
                    setSelectedConsultorKey(consultorKey);
                    setConsultorError(null);
                  }}
                  isConsultorLocked={Boolean(consultorFromQuery)}
                  isLoadingConsultores={isLoadingConsultores}
                  consultorError={consultorError}
                />
              );
            }
            default:
              return null;
          }
        })()}
      </div>
    );
  };

  const headingTitle = isPublic
    ? "Cadastre-se na Planvita"
    : "Cadastro de Cliente";

  const headingSubtitle =
    "Complete os passos abaixo para contratar o seu plano Planvita de forma rápida e segura.";

  const containerClasses = isPublic
    ? "min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 py-10 md:py-16"
    : "min-h-screen bg-gray-50 py-8";

  return (
    <div className={containerClasses}>
      <div className="mx-auto w-full px-4 md:px-6">
        <div className={`mb-8 ${isPublic ? "text-center" : "text-left"}`}>
          {isPublic && (
            <Image
              src={logoPlanvita}
              width={140}
              height={70}
              alt="Logo Planvita"
              className="mx-auto mb-4"
            />
          )}
          <h1
            className={
              isPublic
                ? "text-2xl font-bold text-green-700 md:text-3xl"
                : "text-[26px] font-semibold text-[#121317]"
            }
          >
            {headingTitle}
          </h1>
          {isPublic && <p className="mt-2 text-gray-600">{headingSubtitle}</p>}
        </div>

        {renderStepIndicator()}

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            {renderCurrentStep()}

            <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
              <Button
                type="button"
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === 1}
                className="flex items-center gap-2 rounded-[16px] border border-[#D5D5D5] bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canContinueStep4}
                  className="flex items-center gap-2 rounded-[16px] bg-[#1EBA4B] px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Continuar <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-[16px] bg-[#1EBA4B] px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
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
