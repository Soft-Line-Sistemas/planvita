"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Cliente } from "@/types/ClientType";

interface Props {
  clientes: Cliente[];
}

export const ClienteCards = ({ clientes }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {clientes.map((c) => (
      <Card
        key={c.id}
        className="border border-gray-200 hover:shadow-md transition rounded-lg"
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">{c.nome}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                c.statusPlano === "Ativo"
                  ? "bg-emerald-100 text-emerald-700"
                  : c.statusPlano === "Pendente"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
              }`}
            >
              {c.statusPlano}
            </span>
          </div>
          <p className="text-sm text-gray-600">{c.plano.nome}</p>
          <p className="text-sm text-gray-600">{c.endereco.cidade}</p>
          <p className="text-sm text-gray-600">{c.telefone}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
