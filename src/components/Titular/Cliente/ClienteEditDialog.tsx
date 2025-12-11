"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  atualizarCliente,
  atualizarPlanoDoCliente,
  type UpdateClientePayload,
} from "@/services/cliente.service";
import api from "@/utils/api";
import { sanitizePlanoArray } from "@/utils/planos";
import { extractApiError } from "@/utils/httpError";
import type { Cliente } from "@/types/ClientType";
import type { Plano } from "@/types/PlanType";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EditClienteFormValues = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  statusPlano: string;
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  planoId: string;
};

type ClienteEditDialogProps = {
  open: boolean;
  onClose: () => void;
  cliente: Cliente;
  onUpdated?: () => void;
};

const STATUS_OPCOES = [
  { value: "ATIVO", label: "Ativo" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "INADIMPLENTE", label: "Inadimplente" },
  { value: "CANCELADO", label: "Cancelado" },
];

export function ClienteEditDialog({
  open,
  onClose,
  cliente,
  onUpdated,
}: ClienteEditDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditClienteFormValues>({
    defaultValues: {
      nome: cliente.nome ?? "",
      email: cliente.email ?? "",
      telefone: cliente.telefone ?? "",
      cpf: cliente.cpf ?? "",
      dataNascimento: cliente.dataNascimento ?? "",
      statusPlano: (cliente.statusPlano ?? "ATIVO").toUpperCase(),
      cep: cliente.endereco?.cep ?? "",
      uf: cliente.endereco?.uf ?? "",
      cidade: cliente.endereco?.cidade ?? "",
      bairro: cliente.endereco?.bairro ?? "",
      logradouro: cliente.endereco?.logradouro ?? "",
      numero: cliente.endereco?.numero ?? "",
      complemento: cliente.endereco?.complemento ?? "",
      planoId: cliente.plano?.id ? String(cliente.plano.id) : "none",
    },
  });

  useEffect(() => {
    form.register("statusPlano");
    form.register("planoId");
  }, [form]);

  useEffect(() => {
    if (!cliente) return;
    form.reset({
      nome: cliente.nome ?? "",
      email: cliente.email ?? "",
      telefone: cliente.telefone ?? "",
      cpf: cliente.cpf ?? "",
      dataNascimento: cliente.dataNascimento ?? "",
      statusPlano: (cliente.statusPlano ?? "ATIVO").toUpperCase(),
      cep: cliente.endereco?.cep ?? "",
      uf: cliente.endereco?.uf ?? "",
      cidade: cliente.endereco?.cidade ?? "",
      bairro: cliente.endereco?.bairro ?? "",
      logradouro: cliente.endereco?.logradouro ?? "",
      numero: cliente.endereco?.numero ?? "",
      complemento: cliente.endereco?.complemento ?? "",
      planoId: cliente.plano?.id ? String(cliente.plano.id) : "none",
    });
  }, [cliente, form]);

  const {
    data: planos,
    isLoading: isLoadingPlanos,
    isError: isErrorPlanos,
  } = useQuery<Plano[]>({
    queryKey: ["planos", "cliente-edit"],
    queryFn: async () => {
      const response = await api.get("/plano");
      return sanitizePlanoArray(response.data);
    },
    staleTime: 60_000,
    enabled: open,
  });

  const atualizarDados = useMutation({
    mutationFn: (payload: UpdateClientePayload) =>
      atualizarCliente(cliente.id, payload),
  });

  const atualizarPlano = useMutation({
    mutationFn: (planoId: number | null) =>
      atualizarPlanoDoCliente(cliente.id, planoId),
  });

  const planoAtualId = useMemo(
    () => (cliente.plano?.id ? String(cliente.plano.id) : "none"),
    [cliente.plano?.id],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: UpdateClientePayload = {
      nome: values.nome.trim(),
      email: values.email.trim(),
      telefone: values.telefone.trim(),
      cpf: values.cpf.trim(),
      dataNascimento: values.dataNascimento,
      statusPlano: values.statusPlano.toUpperCase(),
      cep: values.cep.trim(),
      uf: values.uf.trim(),
      cidade: values.cidade.trim(),
      bairro: values.bairro.trim(),
      logradouro: values.logradouro.trim(),
      numero: values.numero.trim(),
      complemento: values.complemento.trim(),
    };

    const parsedPlanoId = Number(values.planoId);
    const planoIdNumber =
      values.planoId && !Number.isNaN(parsedPlanoId) ? parsedPlanoId : null;

    try {
      await atualizarDados.mutateAsync(payload);

      if (values.planoId !== planoAtualId) {
        await atualizarPlano.mutateAsync(planoIdNumber);
      }

      toast.success("Cliente atualizado com sucesso!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cliente-detalhes"] }),
        queryClient.invalidateQueries({ queryKey: ["clientes"] }),
      ]);

      onUpdated?.();
      onClose();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error("Não foi possível atualizar o cliente", {
        description: message,
      });
    }
  });

  const isSubmitting =
    form.formState.isSubmitting ||
    atualizarDados.isPending ||
    atualizarPlano.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar dados do cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" {...form.register("nome")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...form.register("telefone")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...form.register("cpf")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                {...form.register("dataNascimento")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status do plano</Label>
              <Select
                value={form.watch("statusPlano")}
                onValueChange={(value) => form.setValue("statusPlano", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPCOES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" {...form.register("cep")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input id="uf" {...form.register("uf")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...form.register("cidade")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" {...form.register("bairro")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input id="logradouro" {...form.register("logradouro")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" {...form.register("numero")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input id="complemento" {...form.register("complemento")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Plano vinculado</Label>
            <Select
              value={form.watch("planoId")}
              onValueChange={(value) => form.setValue("planoId", value)}
              disabled={isLoadingPlanos || isErrorPlanos}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingPlanos
                      ? "Carregando planos..."
                      : "Selecione o plano"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem plano vinculado</SelectItem>
                {(planos ?? []).map((plano) => (
                  <SelectItem key={plano.id} value={String(plano.id)}>
                    {plano.nome} — R${" "}
                    {Number(plano.valorMensal ?? 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isErrorPlanos && (
              <p className="text-sm text-red-600">
                Não foi possível carregar os planos. Tente novamente mais tarde.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
