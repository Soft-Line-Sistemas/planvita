"use client";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail } from "lucide-react";
import {
  formatCPF,
  formatPhone,
  formatWhatsApp,
  formatRG,
} from "@/helpers/formHelpers";
import { dadosPessoaisSchema } from "./schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <Input
        id="nomeCompleto"
        maxLength={1000}
        {...form.register("nomeCompleto")}
      />
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
          maxLength={14}
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

    {/* Sexo e RG */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="sexo" className="flex items-center gap-1">
          Sexo <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.watch("sexo") || ""}
          onValueChange={(value) => {
            if (value === "Masculino" || value === "Feminino") {
              form.setValue("sexo", value);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Masculino">Masculino</SelectItem>
            <SelectItem value="Feminino">Feminino</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.sexo && (
          <p className="text-red-600 text-sm">
            {String(form.formState.errors.sexo.message)}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="rg" className="flex items-center gap-1">
          RG <span className="text-red-500">*</span>
        </Label>
        <Input
          id="rg"
          maxLength={12}
          value={form.watch("rg") || ""}
          onChange={(e) => form.setValue("rg", formatRG(e.target.value))}
        />
        {form.formState.errors.rg && (
          <p className="text-red-600 text-sm">
            {String(form.formState.errors.rg.message)}
          </p>
        )}
      </div>
    </div>

    {/* Naturalidade */}
    <div className="space-y-1">
      <Label htmlFor="naturalidade" className="flex items-center gap-1">
        Naturalidade <span className="text-red-500">*</span>
      </Label>
      <Input
        id="naturalidade"
        maxLength={191}
        {...form.register("naturalidade")}
      />
      {form.formState.errors.naturalidade && (
        <p className="text-red-600 text-sm">
          {String(form.formState.errors.naturalidade.message)}
        </p>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="situacaoConjugal" className="flex items-center gap-1">
          Situação conjugal
          <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.watch("situacaoConjugal") || ""}
          onValueChange={(value) => form.setValue("situacaoConjugal", value)}
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
        {form.formState.errors.situacaoConjugal && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.situacaoConjugal.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="profissao" className="flex items-center gap-1">
          Profissão
          <span className="text-red-500">*</span>
        </Label>
        <Input id="profissao" maxLength={191} {...form.register("profissao")} />
        {form.formState.errors.profissao && (
          <p className="text-red-600 text-sm">
            {form.formState.errors.profissao.message}
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
          maxLength={15}
          value={form.watch("telefone") || ""}
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
          maxLength={14}
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
      <Input
        id="email"
        type="email"
        maxLength={1000}
        {...form.register("email")}
      />
      {form.formState.errors.email && (
        <p className="text-red-600 text-sm">
          {form.formState.errors.email.message}
        </p>
      )}
    </div>
  </div>
);
