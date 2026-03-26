"use client";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
// import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Phone, Mail } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCPF,
  formatPhone,
  formatWhatsApp,
  formatRG,
  formatCEP,
} from "@/helpers/formHelpers";
import { RELATIONSHIP_OPTIONS } from "@/constants/relationshipOptions";

interface ResponsavelFormValues {
  usarMesmosDados: boolean;
  nomeCompleto?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  sexo?: string;
  naturalidade?: string;
  parentesco?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  situacaoConjugal?: string;
  profissao?: string;
  cep?: string;
  uf?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  complemento?: string;
  numero?: string;
  pontoReferencia?: string;
}

interface Props {
  form: UseFormReturn<ResponsavelFormValues>;
  usarMesmosDados: boolean;
  setUsarMesmosDados: (value: boolean) => void;
}

export const ResponsavelFinanceiroForm = ({
  form,
  usarMesmosDados,
  // setUsarMesmosDados,
}: Props) => {
  const errors = form.formState.errors;

  useEffect(() => {
    form.register("cep");
    form.register("uf");
    form.register("cidade");
    form.register("bairro");
    form.register("logradouro");
  }, [form]);

  useEffect(() => {
    form.setValue("usarMesmosDados", usarMesmosDados);
  }, [usarMesmosDados, form]);

  const cepValue = form.watch("cep");
  useEffect(() => {
    const cep = (cepValue ?? "").replace(/\D/g, "");
    if (cep.length !== 8) return;

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.erro) return;
        form.setValue("logradouro", data.logradouro || "");
        form.setValue("bairro", data.bairro || "");
        form.setValue("cidade", data.localidade || "");
        form.setValue("uf", data.uf || "");
      })
      .catch(() => {
        // silencioso para não interromper o fluxo
      });
  }, [cepValue, form]);

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <Switch
          checked={usarMesmosDados}
          onCheckedChange={setUsarMesmosDados}
          className="data-[state=checked]:bg-green-600"
        />
        <Label className="text-green-800 font-medium">
          USAR OS MESMOS DADOS DO TITULAR?
        </Label>
      </div> */}

      {!usarMesmosDados && (
        <div className="space-y-6">
          <div className="space-y-1">
            <Label
              htmlFor="nomeCompletoResp"
              className="flex items-center gap-1"
            >
              Nome completo
              <span className="text-red-500">*</span>
            </Label>
            <Input id="nomeCompletoResp" {...form.register("nomeCompleto")} />
            {errors.nomeCompleto && (
              <p className="text-sm text-red-500 mt-1">
                {String(errors.nomeCompleto.message)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cpfResp" className="flex items-center gap-1">
                CPF
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cpfResp"
                {...form.register("cpf")}
                onChange={(e) =>
                  form.setValue("cpf", formatCPF(e.target.value))
                }
              />
              {errors.cpf && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.cpf.message)}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="rgResp">RG</Label>
              <Input
                id="rgResp"
                {...form.register("rg")}
                onChange={(e) => form.setValue("rg", formatRG(e.target.value))}
              />
              {errors.rg && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.rg.message)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label
                htmlFor="dataNascimentoResp"
                className="flex items-center gap-1"
              >
                Data de nascimento
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="dataNascimentoResp"
                {...form.register("dataNascimento")}
              />
              {errors.dataNascimento && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.dataNascimento.message)}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="parentesco" className="flex items-center gap-1">
                Parentesco
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.watch("parentesco") || ""}
                onValueChange={(value) => form.setValue("parentesco", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.parentesco && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.parentesco.message)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="sexoResp" className="flex items-center gap-1">
                Sexo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.watch("sexo") || ""}
                onValueChange={(value) => form.setValue("sexo", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
              {errors.sexo && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.sexo.message)}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="naturalidadeResp"
                className="flex items-center gap-1"
              >
                Naturalidade <span className="text-red-500">*</span>
              </Label>
              <Input id="naturalidadeResp" {...form.register("naturalidade")} />
              {errors.naturalidade && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.naturalidade.message)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label
                htmlFor="situacaoConjugalResp"
                className="flex items-center gap-1"
              >
                Situação conjugal
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.watch("situacaoConjugal") || ""}
                onValueChange={(value) =>
                  form.setValue("situacaoConjugal", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                  <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                  <SelectItem value="União estável">União estável</SelectItem>
                  <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                  <SelectItem value="Separado(a)">Separado(a)</SelectItem>
                  <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                </SelectContent>
              </Select>
              {errors.situacaoConjugal && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.situacaoConjugal.message)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="profissaoResp"
                className="flex items-center gap-1"
              >
                Profissão
                <span className="text-red-500">*</span>
              </Label>
              <Input id="profissaoResp" {...form.register("profissao")} />
              {errors.profissao && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.profissao.message)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900">
              Endereço do responsável
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label
                  htmlFor="cepResp"
                  className="inline-flex items-center gap-1"
                >
                  CEP <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cepResp"
                  value={form.watch("cep") || ""}
                  onChange={(e) =>
                    form.setValue("cep", formatCEP(e.target.value))
                  }
                  placeholder="00000-000"
                />
                {errors.cep && (
                  <p className="text-sm text-red-500 mt-1">
                    {String(errors.cep.message)}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="ufResp"
                  className="inline-flex items-center gap-1"
                >
                  UF <span className="text-red-500">*</span>
                </Label>
                <Input id="ufResp" {...form.register("uf")} />
                {errors.uf && (
                  <p className="text-sm text-red-500 mt-1">
                    {String(errors.uf.message)}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="cidadeResp"
                  className="inline-flex items-center gap-1"
                >
                  Cidade <span className="text-red-500">*</span>
                </Label>
                <Input id="cidadeResp" {...form.register("cidade")} />
                {errors.cidade && (
                  <p className="text-sm text-red-500 mt-1">
                    {String(errors.cidade.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="bairroResp"
                  className="inline-flex items-center gap-1"
                >
                  Bairro <span className="text-red-500">*</span>
                </Label>
                <Input id="bairroResp" {...form.register("bairro")} />
                {errors.bairro && (
                  <p className="text-sm text-red-500 mt-1">
                    {String(errors.bairro.message)}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="logradouroResp"
                  className="inline-flex items-center gap-1"
                >
                  Rua <span className="text-red-500">*</span>
                </Label>
                <Input id="logradouroResp" {...form.register("logradouro")} />
                {errors.logradouro && (
                  <p className="text-sm text-red-500 mt-1">
                    {String(errors.logradouro.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="numeroResp"
                  className="inline-flex items-center gap-1"
                >
                  Número <span className="text-red-500">*</span>
                </Label>
                <Input id="numeroResp" {...form.register("numero")} />
                {errors.numero && (
                  <p className="text-sm text-red-500 mt-1">
                    {String(errors.numero.message)}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="complementoResp"
                  className="inline-flex items-center gap-1"
                >
                  Complemento
                </Label>
                <Input id="complementoResp" {...form.register("complemento")} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label
                  htmlFor="pontoReferenciaResp"
                  className="inline-flex items-center gap-1"
                >
                  Ponto de referência <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pontoReferenciaResp"
                  {...form.register("pontoReferencia")}
                />
                {errors.pontoReferencia && (
                  <p className="text-sm text-red-500 mt-1">
                    {String(errors.pontoReferencia.message)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="emailResp" className="flex items-center gap-1">
              <Mail className="w-4 h-4 mr-1" />
              E-mail
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emailResp"
              type="email"
              {...form.register("email", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "E-mail inválido",
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {String(errors.email.message)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="telefoneResp" className="flex items-center gap-1">
                <Phone className="w-4 h-4 mr-1" />
                Telefone/Celular
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefoneResp"
                {...form.register("telefone")}
                onChange={(e) =>
                  form.setValue("telefone", formatPhone(e.target.value))
                }
                onBlur={() => {
                  const digits = form.watch("telefone")?.replace(/\D/g, "");
                  if (digits?.length === 11) {
                    const whatsapp =
                      digits[2] === "9"
                        ? digits.slice(0, 2) + digits.slice(3)
                        : digits.slice(0, 10);
                    form.setValue("whatsapp", formatWhatsApp(whatsapp));
                  }
                }}
              />
              {errors.telefone && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.telefone.message)}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="whatsappResp" className="flex items-center gap-1">
                WhatsApp
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="whatsappResp"
                {...form.register("whatsapp")}
                onChange={(e) =>
                  form.setValue("whatsapp", formatWhatsApp(e.target.value))
                }
              />
              {errors.whatsapp && (
                <p className="text-sm text-red-500 mt-1">
                  {String(errors.whatsapp.message)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
