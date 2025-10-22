"use client";

import { Checkbox } from "@/components/ui/checkbox";
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  clientes: any[];
  selectedClientes: string[];
  setSelectedClientes: (ids: string[]) => void;
}

export const ClienteTable = ({
  clientes,
  selectedClientes,
  setSelectedClientes,
}: Props) => {
  const toggleSelect = (id: string) => {
    setSelectedClientes(
      selectedClientes.includes(id)
        ? selectedClientes.filter((c) => c !== id)
        : [...selectedClientes, id],
    );
  };

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">
              <Checkbox
                checked={selectedClientes.length === clientes.length}
                onCheckedChange={(checked) =>
                  setSelectedClientes(checked ? clientes.map((c) => c.id) : [])
                }
              />
            </th>
            <th className="p-3 text-left">Nome</th>
            <th className="p-3 text-left">Plano</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Telefone</th>
            <th className="p-3 text-left">Cidade</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-b hover:bg-gray-50 transition">
              <td className="p-3">
                <Checkbox
                  checked={selectedClientes.includes(c.id)}
                  onCheckedChange={() => toggleSelect(c.id)}
                />
              </td>
              <td className="p-3 font-medium">{c.nome}</td>
              <td className="p-3">{c.plano?.nome ?? "—"}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.statusPlano === "Ativo"
                      ? "bg-emerald-100 text-emerald-700"
                      : c.statusPlano === "Pendente"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {c.statusPlano}
                </span>
              </td>
              <td className="p-3">{c.telefone}</td>
              <td className="p-3">{c.cidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
