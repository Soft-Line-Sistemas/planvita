"use client";
import React from "react";
import { Veiculo } from "@/types/VeiculoType";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export default function VeiculoForm({
  form,
  updateForm,
  onSubmit,
  onCancel,
  saving,
  actionLabel,
}: {
  form: Partial<Veiculo>;
  updateForm: <K extends keyof Veiculo>(
    key: K,
    value: Veiculo[K] | undefined,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  actionLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="placa">Placa</Label>
          <Input
            id="placa"
            required
            value={form.placa ?? ""}
            onChange={(e) => updateForm("placa", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="modelo">Modelo</Label>
          <Input
            id="modelo"
            required
            value={form.modelo ?? ""}
            onChange={(e) => updateForm("modelo", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ano">Ano</Label>
          <Input
            id="ano"
            required
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            value={form.ano ?? new Date().getFullYear()}
            onChange={(e) => updateForm("ano", Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <Input
            id="tipo"
            required
            value={form.tipo ?? ""}
            onChange={(e) => updateForm("tipo", e.target.value)}
            placeholder="ex: van, carro funerário"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="km">Quilometragem atual</Label>
          <Input
            id="km"
            type="number"
            value={form.quilometragemAtual ?? ""}
            onChange={(e) =>
              updateForm(
                "quilometragemAtual",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <Checkbox
            id="ativo"
            checked={form.ativo ?? true}
            onCheckedChange={(checked) => updateForm("ativo", checked === true)}
          />
          <Label htmlFor="ativo" className="font-normal">
            Veículo ativo
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : actionLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
