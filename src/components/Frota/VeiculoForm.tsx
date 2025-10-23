"use client";
import React from "react";
import { Veiculo } from "@/types/VeiculoType";

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
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm">Placa</span>
          <input
            required
            value={form.placa ?? ""}
            onChange={(e) => updateForm("placa", e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Modelo</span>
          <input
            required
            value={form.modelo ?? ""}
            onChange={(e) => updateForm("modelo", e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Ano</span>
          <input
            required
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            value={form.ano ?? new Date().getFullYear()}
            onChange={(e) => updateForm("ano", Number(e.target.value))}
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Tipo</span>
          <input
            required
            value={form.tipo ?? ""}
            onChange={(e) => updateForm("tipo", e.target.value)}
            placeholder="ex: van, carro funerário"
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Quilometragem atual</span>
          <input
            type="number"
            value={form.quilometragemAtual ?? ""}
            onChange={(e) =>
              updateForm(
                "quilometragemAtual",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.ativo ?? true}
            onChange={(e) => updateForm("ativo", e.target.checked)}
          />
          <span className="text-sm">Ativo</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 ${
            actionLabel === "Salvar" ? "bg-amber-600" : "bg-green-600"
          } text-white rounded disabled:opacity-60`}
        >
          {saving ? "Salvando..." : actionLabel}
        </button>
      </div>
    </form>
  );
}
