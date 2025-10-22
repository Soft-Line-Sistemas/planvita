"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, Table } from "lucide-react";
import { Cliente } from "@/types/ClientType";

interface Props {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  planoFilter: string;
  setPlanoFilter: (value: string) => void;
  clientes: Cliente[];
  viewMode: "table" | "cards";
  setViewMode: (mode: "table" | "cards") => void;
}

export const ClienteFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  planoFilter,
  setPlanoFilter,
  clientes,
  viewMode,
  setViewMode,
}: Props) => {
  const planos = Array.from(
    new Set(clientes.map((c) => c.plano?.nome ?? "Sem plano")),
  );

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex flex-1 gap-2 w-full md:w-auto">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, e-mail, CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="border border-gray-300 rounded-md text-sm px-3 py-2 bg-white focus:ring-1 focus:ring-blue-400"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          <option value="Ativo">Ativos</option>
          <option value="Pendente">Pendentes</option>
          <option value="Inadimplente">Inadimplentes</option>
        </select>

        <select
          className="border border-gray-300 rounded-md text-sm px-3 py-2 bg-white focus:ring-1 focus:ring-blue-400"
          value={planoFilter}
          onChange={(e) => setPlanoFilter(e.target.value)}
        >
          <option value="todos">Todos os planos</option>
          {planos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="icon"
            className="rounded-none"
            onClick={() => setViewMode("table")}
          >
            <Table className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="icon"
            className="rounded-none"
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
