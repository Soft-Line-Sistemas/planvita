"use client";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Phone, Mail } from "lucide-react";
import {
  formatCPF,
  formatPhone,
  formatWhatsApp,
  formatRG,
} from "@/helpers/formHelpers";

interface ResponsavelFormValues {
  usarMesmosDados: boolean;
  nomeCompleto?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  parentesco?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
}

interface Props {
  form: UseFormReturn<ResponsavelFormValues>;
  usarMesmosDados: boolean;
  setUsarMesmosDados: (value: boolean) => void;
}

export const ResponsavelFinanceiroForm = ({
  form,
  usarMesmosDados,
  setUsarMesmosDados,
}: Props) => {
  useEffect(() => {
    form.setValue("usarMesmosDados", usarMesmosDados);
  }, [usarMesmosDados, form]);

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
            </div>
            <div className="space-y-1">
              <Label htmlFor="rgResp">RG</Label>
              <Input
                id="rgResp"
                {...form.register("rg")}
                onChange={(e) => form.setValue("rg", formatRG(e.target.value))}
              />
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
            </div>
            <div className="space-y-1">
              <Label htmlFor="parentesco" className="flex items-center gap-1">
                Parentesco
                <span className="text-red-500">*</span>
              </Label>
              <Input id="parentesco" {...form.register("parentesco")} />
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
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="telefoneResp" className="flex items-center gap-1">
                <Phone className="w-4 h-4 mr-1" />
                Telefone
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefoneResp"
                {...form.register("telefone")}
                onChange={(e) =>
                  form.setValue("telefone", formatPhone(e.target.value))
                }
              />
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
