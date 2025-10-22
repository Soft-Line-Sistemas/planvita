"use client";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCEP } from "@/helpers/formHelpers";

interface EnderecoFormValues {
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  complemento?: string;
  numero: string;
}

interface Props {
  form: UseFormReturn<EnderecoFormValues>;
}

export const EnderecoForm = ({ form }: Props) => {
  useEffect(() => {
    const cep = form.watch("cep")?.replace(/\D/g, "");

    if (cep?.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            form.setValue("logradouro", data.logradouro || "");
            form.setValue("bairro", data.bairro || "");
            form.setValue("cidade", data.localidade || "");
            form.setValue("uf", data.uf || "");
          }
        })
        .catch(() => {
          console.warn("Erro ao buscar CEP no ViaCEP");
        });
    }
  }, [form.watch("cep")]);

  return (
    <div className="space-y-6">
      {/* Linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="cep" className="inline-flex items-center gap-1">
            CEP <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cep"
            value={form.watch("cep") || ""}
            onChange={(e) => form.setValue("cep", formatCEP(e.target.value))}
            placeholder="00000-000"
          />
        </div>

        <div>
          <Label htmlFor="uf" className="inline-flex items-center gap-1">
            UF <span className="text-red-500">*</span>
          </Label>
          <Input id="uf" {...form.register("uf")} />
        </div>

        <div>
          <Label htmlFor="cidade" className="inline-flex items-center gap-1">
            Cidade <span className="text-red-500">*</span>
          </Label>
          <Input id="cidade" {...form.register("cidade")} />
        </div>
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bairro" className="inline-flex items-center gap-1">
            Bairro <span className="text-red-500">*</span>
          </Label>
          <Input id="bairro" {...form.register("bairro")} />
        </div>
        <div>
          <Label
            htmlFor="logradouro"
            className="inline-flex items-center gap-1"
          >
            Rua <span className="text-red-500">*</span>
          </Label>
          <Input id="logradouro" {...form.register("logradouro")} />
        </div>
      </div>

      {/* Linha 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero" className="inline-flex items-center gap-1">
            Número <span className="text-red-500">*</span>
          </Label>
          <Input id="numero" {...form.register("numero")} />
        </div>
        <div>
          <Label
            htmlFor="complemento"
            className="inline-flex items-center gap-1"
          >
            Complemento
          </Label>
          <Input id="complemento" {...form.register("complemento")} />
        </div>
      </div>
    </div>
  );
};
