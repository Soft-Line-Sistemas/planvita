"use client";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail } from "lucide-react";
import { formatCPF, formatPhone, formatWhatsApp } from "@/helpers/formHelpers";
import { dadosPessoaisSchema } from "./schemas";

interface Props {
  form: UseFormReturn<z.infer<typeof dadosPessoaisSchema>>;
}

export const DadosPessoaisForm = ({ form }: Props) => (
  <div className="space-y-6">
    {/* Nome */}
    <div className="space-y-1">
      <Label htmlFor="nomeCompleto" className="flex items-center gap-1">
        Nome completo
        <span className="text-red-500">*</span>
      </Label>
      <Input id="nomeCompleto" {...form.register("nomeCompleto")} />
      {form.formState.errors.nomeCompleto && (
        <p className="text-red-600 text-sm">
          {form.formState.errors.nomeCompleto.message}
        </p>
      )}
    </div>

    {/* CPF e Data Nascimento */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="cpf" className="flex items-center gap-1">
          CPF
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cpf"
          value={form.watch("cpf") || ""}
          onChange={(e) => form.setValue("cpf", formatCPF(e.target.value))}
        />
        {form.formState.errors.cpf && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.cpf.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="dataNascimento" className="flex items-center gap-1">
          Data de nascimento
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="dataNascimento"
          type="date"
          {...form.register("dataNascimento")}
        />
        {form.formState.errors.dataNascimento && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.dataNascimento.message}
          </p>
        )}
      </div>
    </div>

    {/* Telefone e WhatsApp */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="telefone" className="flex items-center gap-1">
          <Phone className="w-4 h-4" />
          <span>Telefone/Celular</span>
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="telefone"
          value={form.watch("telefone") || ""}
          onChange={(e) =>
            form.setValue("telefone", formatPhone(e.target.value))
          }
          onBlur={() => {
            const digits = form.watch("telefone")?.replace(/\D/g, "");
            if (digits?.length === 11) {
              const whatsapp =
                digits[0] + digits[1] + digits[2] + digits.slice(3 + 1);
              form.setValue("whatsapp", formatWhatsApp(whatsapp));
            }
          }}
        />
        {form.formState.errors.telefone && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.telefone.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="whatsapp" className="flex items-center gap-1">
          <Phone className="w-4 h-4 text-green-600" />
          <span>WhatsApp</span>
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="whatsapp"
          value={form.watch("whatsapp") || ""}
          onChange={(e) =>
            form.setValue("whatsapp", formatWhatsApp(e.target.value))
          }
        />
        {form.formState.errors.whatsapp && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.whatsapp.message}
          </p>
        )}
      </div>
    </div>

    {/* Email */}
    <div className="space-y-1">
      <Label htmlFor="email" className="flex items-center gap-1">
        <Mail className="w-4 h-4" />
        <span>E-mail</span>
        <span className="text-red-500">*</span>
      </Label>
      <Input id="email" type="email" {...form.register("email")} />
      {form.formState.errors.email && (
        <p className="text-red-600 text-sm">
          {form.formState.errors.email.message}
        </p>
      )}
    </div>
  </div>
);
