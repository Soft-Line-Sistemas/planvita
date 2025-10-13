"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import logoPlanvita from "@/assets/logo-planvita.png";
import Image from "next/image";

// Schemas de validação para cada etapa
const dadosPessoaisSchema = z.object({
  nomeCompleto: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  telefone: z.string().min(10, "Telefone é obrigatório"),
  whatsapp: z.string().min(10, "WhatsApp é obrigatório"),
  email: z.string().email("E-mail inválido"),
});

const enderecoSchema = z.object({
  cep: z.string().min(8, "CEP é obrigatório"),
  uf: z.string().min(2, "UF é obrigatória"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  logradouro: z.string().min(2, "Logradouro é obrigatório"),
  complemento: z.string().optional(),
  numero: z.string().min(1, "Número é obrigatório"),
});

const responsavelFinanceiroSchema = z.object({
  usarMesmosDados: z.boolean(),
  nomeCompleto: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  dataNascimento: z.string().optional(),
  parentesco: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
});

// const dependentesSchema = z.object({
//   dependentes: z.array(
//     z.object({
//       nome: z.string().min(2, "Nome é obrigatório"),
//       idade: z.string().min(1, "Idade é obrigatória"),
//       parentesco: z.string().min(1, "Parentesco é obrigatório"),
//       telefone: z.string().min(10, "Telefone é obrigatório"),
//       cpf: z.string().min(11, "CPF é obrigatório"),
//     }),
//   ),
// });

interface Dependente {
  nome: string;
  idade: number | null;
  parentesco: string;
  telefone: string;
  cpf: string;
}

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

  // Forms para cada etapa
  const dadosPessoaisForm = useForm({
    resolver: zodResolver(dadosPessoaisSchema),
  });

  const enderecoForm = useForm({
    resolver: zodResolver(enderecoSchema),
  });

  const responsavelForm = useForm({
    resolver: zodResolver(responsavelFinanceiroSchema),
  });

  const getCurrentForm = () => {
    switch (currentStep) {
      case 1:
        return dadosPessoaisForm;
      case 2:
        return enderecoForm;
      case 3:
        return responsavelForm;
      default:
        return dadosPessoaisForm;
    }
  };

  const handleNext = async () => {
    const form = getCurrentForm();
    const isValid = await form.trigger();

    if (isValid) {
      const data = form.getValues();
      setFormData((prev) => ({ ...prev, [`step${currentStep}`]: data }));

      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddDependente = () => {
    setDependentes([
      ...dependentes,
      {
        nome: "",
        idade: null,
        parentesco: "",
        telefone: "",
        cpf: "",
      },
    ]);
  };

  const handleRemoveDependente = (index: number) => {
    setDependentes(dependentes.filter((_, i) => i !== index));
  };

  const handleDependenteChange = <K extends keyof Dependente>(
    index: number,
    field: K,
    value: Dependente[K],
  ) => {
    const newDependentes = [...dependentes];
    newDependentes[index][field] = value;
    setDependentes(newDependentes);
  };

  const handleFinish = () => {
    const finalData = {
      ...formData,
      dependentes,
      usarMesmosDados,
    };

    console.log("Dados do cadastro:", finalData);
    alert("Cadastro realizado com sucesso!");

    // Reset form
    setCurrentStep(1);
    setFormData({});
    setDependentes([]);
    setUsarMesmosDados(false);
    dadosPessoaisForm.reset();
    enderecoForm.reset();
    responsavelForm.reset();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 px-4">
      <div className="flex items-center space-x-2 md:space-x-4">
        {steps.map((step, index) => {
          // const Icon = step.icon;
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

  const renderDadosPessoais = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="nomeCompleto" className="text-gray-700 font-medium">
            Nome completo
          </Label>
          <Input
            id="nomeCompleto"
            placeholder="Como prefere ser chamado"
            className="mt-1"
            {...dadosPessoaisForm.register("nomeCompleto")}
          />
          {dadosPessoaisForm.formState.errors.nomeCompleto && (
            <p className="text-sm text-red-500 mt-1">
              {dadosPessoaisForm.formState.errors.nomeCompleto.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cpf" className="text-gray-700 font-medium">
            CPF
          </Label>
          <Input
            id="cpf"
            placeholder="XXX.XXX.XXX-XX"
            className="mt-1"
            {...dadosPessoaisForm.register("cpf")}
          />
          {dadosPessoaisForm.formState.errors.cpf && (
            <p className="text-sm text-red-500 mt-1">
              {dadosPessoaisForm.formState.errors.cpf.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="dataNascimento" className="text-gray-700 font-medium">
            Data de nascimento
          </Label>
          <Input
            id="dataNascimento"
            type="date"
            className="mt-1"
            {...dadosPessoaisForm.register("dataNascimento")}
          />
          {dadosPessoaisForm.formState.errors.dataNascimento && (
            <p className="text-sm text-red-500 mt-1">
              {dadosPessoaisForm.formState.errors.dataNascimento.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="telefone"
            className="text-gray-700 font-medium flex items-center"
          >
            <Phone className="w-4 h-4 mr-1" />
            Telefone
          </Label>
          <Input
            id="telefone"
            placeholder="Digite seu número"
            className="mt-1"
            {...dadosPessoaisForm.register("telefone")}
          />
          {dadosPessoaisForm.formState.errors.telefone && (
            <p className="text-sm text-red-500 mt-1">
              {dadosPessoaisForm.formState.errors.telefone.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="whatsapp" className="text-gray-700 font-medium">
            WhatsApp
          </Label>
          <Input
            id="whatsapp"
            placeholder="Digite seu número de WhatsApp"
            className="mt-1"
            {...dadosPessoaisForm.register("whatsapp")}
          />
          {dadosPessoaisForm.formState.errors.whatsapp && (
            <p className="text-sm text-red-500 mt-1">
              {dadosPessoaisForm.formState.errors.whatsapp.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label
          htmlFor="email"
          className="text-gray-700 font-medium flex items-center"
        >
          <Mail className="w-4 h-4 mr-1" />
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Digite seu e-mail"
          className="mt-1"
          {...dadosPessoaisForm.register("email")}
        />
        {dadosPessoaisForm.formState.errors.email && (
          <p className="text-sm text-red-500 mt-1">
            {dadosPessoaisForm.formState.errors.email.message}
          </p>
        )}
      </div>
    </div>
  );

  const renderEndereco = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="cep" className="text-gray-700 font-medium">
            CEP
          </Label>
          <Input
            id="cep"
            placeholder="XX.XXX-XXX"
            className="mt-1"
            {...enderecoForm.register("cep")}
          />
          {enderecoForm.formState.errors.cep && (
            <p className="text-sm text-red-500 mt-1">
              {enderecoForm.formState.errors.cep.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="uf" className="text-gray-700 font-medium">
            UF
          </Label>
          <Input
            id="uf"
            placeholder="XX"
            className="mt-1"
            {...enderecoForm.register("uf")}
          />
          {enderecoForm.formState.errors.uf && (
            <p className="text-sm text-red-500 mt-1">
              {enderecoForm.formState.errors.uf.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="cidade" className="text-gray-700 font-medium">
            Cidade
          </Label>
          <Input
            id="cidade"
            placeholder="XX.XXX-XXX"
            className="mt-1"
            {...enderecoForm.register("cidade")}
          />
          {enderecoForm.formState.errors.cidade && (
            <p className="text-sm text-red-500 mt-1">
              {enderecoForm.formState.errors.cidade.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bairro" className="text-gray-700 font-medium">
            Bairro
          </Label>
          <Input
            id="bairro"
            placeholder="Digite o bairro"
            className="mt-1"
            {...enderecoForm.register("bairro")}
          />
          {enderecoForm.formState.errors.bairro && (
            <p className="text-sm text-red-500 mt-1">
              {enderecoForm.formState.errors.bairro.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="logradouro" className="text-gray-700 font-medium">
            Logradouro
          </Label>
          <Input
            id="logradouro"
            placeholder="Digite o bairro"
            className="mt-1"
            {...enderecoForm.register("logradouro")}
          />
          {enderecoForm.formState.errors.logradouro && (
            <p className="text-sm text-red-500 mt-1">
              {enderecoForm.formState.errors.logradouro.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="complemento" className="text-gray-700 font-medium">
            Complemento
          </Label>
          <Input
            id="complemento"
            placeholder="opcional"
            className="mt-1"
            {...enderecoForm.register("complemento")}
          />
        </div>

        <div>
          <Label htmlFor="numero" className="text-gray-700 font-medium">
            Nº
          </Label>
          <Input
            id="numero"
            placeholder="XX"
            className="mt-1"
            {...enderecoForm.register("numero")}
          />
          {enderecoForm.formState.errors.numero && (
            <p className="text-sm text-red-500 mt-1">
              {enderecoForm.formState.errors.numero.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderResponsavelFinanceiro = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <Switch
          checked={usarMesmosDados}
          onCheckedChange={setUsarMesmosDados}
          className="data-[state=checked]:bg-green-600"
        />
        <Label className="text-green-800 font-medium">
          USAR OS MESMOS DADOS DO TITULAR?
        </Label>
      </div>

      {!usarMesmosDados && (
        <div className="space-y-6">
          <div>
            <Label
              htmlFor="nomeCompletoResp"
              className="text-gray-700 font-medium"
            >
              Nome completo
            </Label>
            <Input
              id="nomeCompletoResp"
              placeholder="digite seu nome copleto"
              className="mt-1"
              {...responsavelForm.register("nomeCompleto")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpfResp" className="text-gray-700 font-medium">
                CPF
              </Label>
              <Input
                id="cpfResp"
                className="mt-1"
                {...responsavelForm.register("cpf")}
              />
            </div>

            <div>
              <Label htmlFor="rgResp" className="text-gray-700 font-medium">
                RG
              </Label>
              <Input
                id="rgResp"
                className="mt-1"
                {...responsavelForm.register("rg")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="dataNascimentoResp"
                className="text-gray-700 font-medium"
              >
                Data de nascimento
              </Label>
              <Input
                id="dataNascimentoResp"
                type="date"
                className="mt-1"
                {...responsavelForm.register("dataNascimento")}
              />
            </div>

            <div>
              <Label htmlFor="parentesco" className="text-gray-700 font-medium">
                Parentesco
              </Label>
              <Input
                id="parentesco"
                className="mt-1"
                {...responsavelForm.register("parentesco")}
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="emailResp"
              className="text-gray-700 font-medium flex items-center"
            >
              <Mail className="w-4 h-4 mr-1" />
              E-mail
            </Label>
            <Input
              id="emailResp"
              type="email"
              placeholder="digite seu melhor email"
              className="mt-1"
              {...responsavelForm.register("email")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="telefoneResp"
                className="text-gray-700 font-medium flex items-center"
              >
                <Phone className="w-4 h-4 mr-1" />
                Telefone
              </Label>
              <Input
                id="telefoneResp"
                placeholder="Digite seu número"
                className="mt-1"
                {...responsavelForm.register("telefone")}
              />
            </div>

            <div>
              <Label
                htmlFor="whatsappResp"
                className="text-gray-700 font-medium"
              >
                WhatsApp
              </Label>
              <Input
                id="whatsappResp"
                placeholder="Digite seu número de WhatsApp"
                className="mt-1"
                {...responsavelForm.register("whatsapp")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDependentes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Dependentes</h3>
        <Button
          onClick={handleAddDependente}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {dependentes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dependente adicionado ainda.</p>
          <p className="text-sm">
            Clique em Adicionar para incluir dependentes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dependentes.map((dependente, index) => (
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
                <div>
                  <Label className="text-gray-700 font-medium">Nome</Label>
                  <Input
                    value={dependente.nome}
                    onChange={(e) =>
                      handleDependenteChange(index, "nome", e.target.value)
                    }
                    placeholder="Nome completo"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Idade</Label>
                  <Input
                    value={String(dependente.idade)}
                    onChange={(e) =>
                      handleDependenteChange(
                        index,
                        "idade",
                        Number(e.target.value),
                      )
                    }
                    placeholder="Idade"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">
                    Parentesco
                  </Label>
                  <Input
                    value={dependente.parentesco}
                    onChange={(e) =>
                      handleDependenteChange(
                        index,
                        "parentesco",
                        e.target.value,
                      )
                    }
                    placeholder="Ex: Filho(a)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Telefone</Label>
                  <Input
                    value={dependente.telefone}
                    onChange={(e) =>
                      handleDependenteChange(index, "telefone", e.target.value)
                    }
                    placeholder="Telefone"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-gray-700 font-medium">CPF</Label>
                  <Input
                    value={dependente.cpf}
                    onChange={(e) =>
                      handleDependenteChange(index, "cpf", e.target.value)
                    }
                    placeholder="XXX.XXX.XXX-XX"
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          ))}

          {/* Tabela de exemplo como mostrado no design */}
          {dependentes.length > 0 && (
            <Card className="p-4 bg-gray-50">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 text-green-600 font-medium">
                        NOME
                      </th>
                      <th className="text-left py-2 text-green-600 font-medium">
                        IDADE
                      </th>
                      <th className="text-left py-2 text-green-600 font-medium">
                        PARENTESCO
                      </th>
                      <th className="text-left py-2 text-green-600 font-medium">
                        TELEFONE
                      </th>
                      <th className="text-left py-2 text-green-600 font-medium">
                        CPF
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dependentes.map((dep, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2">
                          {dep.nome || "MARIA DA SILVA BRASILEIRO"}
                        </td>
                        <td className="py-2">{dep.idade || "56"}</td>
                        <td className="py-2">{dep.parentesco || "FILHA"}</td>
                        <td className="py-2">
                          {dep.telefone || "71 99999-9999"}
                        </td>
                        <td className="py-2">{dep.cpf || "000.000.000-00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderDadosPessoais();
      case 2:
        return renderEndereco();
      case 3:
        return renderResponsavelFinanceiro();
      case 4:
        return renderDependentes();
      default:
        return renderDadosPessoais();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header com logo */}
        <div className="text-center mb-8">
          <Image
            src={logoPlanvita}
            width={100}
            height={100}
            alt="Logo Campo do Bosque"
            className="w-32 h-auto mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">
            Cadastro de Cliente
          </h1>
          <p className="text-gray-600 mt-2">
            Preencha os dados do cliente para criar um novo plano
          </p>
        </div>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Form content */}
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
            <div className="animate-fade-in">{renderCurrentStep()}</div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  className="bg-green-600 hover:bg-green-700 flex items-center"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700 flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar Cadastro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
