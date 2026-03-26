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
  pontoReferencia: string;
}

interface Props {
  form: UseFormReturn<EnderecoFormValues>;
}

export const EnderecoForm = ({ form }: Props) => {
  const cepValue = form.watch("cep");
  const errors = form.formState.errors;

  useEffect(() => {
    const cep = cepValue?.replace(/\D/g, "");

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
  }, [cepValue, form]);

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
            maxLength={9}
            value={form.watch("cep") || ""}
            onChange={(e) => form.setValue("cep", formatCEP(e.target.value))}
            placeholder="00000-000"
          />
          {errors.cep && (
            <p className="text-sm text-red-500 mt-1">
              {String(errors.cep.message)}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="uf" className="inline-flex items-center gap-1">
            UF <span className="text-red-500">*</span>
          </Label>
          <Input id="uf" maxLength={5} {...form.register("uf")} />
          {errors.uf && (
            <p className="text-sm text-red-500 mt-1">
              {String(errors.uf.message)}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="cidade" className="inline-flex items-center gap-1">
            Cidade <span className="text-red-500">*</span>
          </Label>
          <Input id="cidade" maxLength={1000} {...form.register("cidade")} />
          {errors.cidade && (
            <p className="text-sm text-red-500 mt-1">
              {String(errors.cidade.message)}
            </p>
          )}
        </div>
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bairro" className="inline-flex items-center gap-1">
            Bairro <span className="text-red-500">*</span>
          </Label>
          <Input id="bairro" maxLength={1000} {...form.register("bairro")} />
          {errors.bairro && (
            <p className="text-sm text-red-500 mt-1">
              {String(errors.bairro.message)}
            </p>
          )}
        </div>
        <div>
          <Label
            htmlFor="logradouro"
            className="inline-flex items-center gap-1"
          >
            Rua <span className="text-red-500">*</span>
          </Label>
          <Input
            id="logradouro"
            maxLength={1000}
            {...form.register("logradouro")}
          />
          {errors.logradouro && (
            <p className="text-sm text-red-500 mt-1">
              {String(errors.logradouro.message)}
            </p>
          )}
        </div>
      </div>

      {/* Linha 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero" className="inline-flex items-center gap-1">
            Número <span className="text-red-500">*</span>
          </Label>
          <Input id="numero" maxLength={1000} {...form.register("numero")} />
          {errors.numero && (
            <p className="text-sm text-red-500 mt-1">
              {String(errors.numero.message)}
            </p>
          )}
        </div>
        <div>
          <Label
            htmlFor="complemento"
            className="inline-flex items-center gap-1"
          >
            Complemento
          </Label>
          <Input
            id="complemento"
            maxLength={1000}
            {...form.register("complemento")}
          />
        </div>
      </div>

      {/* Linha 4 */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label
            htmlFor="pontoReferencia"
            className="inline-flex items-center gap-1"
          >
            Ponto de referência <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pontoReferencia"
            maxLength={255}
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
  );
};
