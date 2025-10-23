"use client";
import React from "react";
import { Veiculo } from "@/types/VeiculoType";

export default function VeiculoTable({
  veiculos,
  loading,
  error,
  onEdit,
  onDelete,
}: {
  veiculos: Veiculo[];
  loading: boolean;
  error: string | null;
  onEdit: (v: Veiculo) => void;
  onDelete: (id: number) => void;
}) {
  if (loading) return <p>Carregando...</p>;
  if (error) return <p className="text-red-600">Erro: {error}</p>;

  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full divide-y">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold">Placa</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">
              Modelo
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Ano</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Tipo</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">
              Km atual
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Ativo</th>
            <th className="px-4 py-2 text-right text-sm font-semibold">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {veiculos.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-4 text-gray-500">
                Nenhum veículo encontrado.
              </td>
            </tr>
          ) : (
            veiculos.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-2 text-sm">{v.placa}</td>
                <td className="px-4 py-2 text-sm">{v.modelo}</td>
                <td className="px-4 py-2 text-sm">{v.ano}</td>
                <td className="px-4 py-2 text-sm">{v.tipo}</td>
                <td className="px-4 py-2 text-sm">
                  {v.quilometragemAtual ?? "—"}
                </td>
                <td className="px-4 py-2 text-sm">{v.ativo ? "Sim" : "Não"}</td>
                <td className="px-4 py-2 text-right text-sm flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(v)}
                    className="px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(v.id)}
                    className="px-3 py-1 border rounded text-red-600 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
