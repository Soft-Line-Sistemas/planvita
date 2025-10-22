"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

import { ClienteHeader } from "@/components/Titular/Cliente/ClienteHeader";
import { ClienteStats } from "@/components/Titular/Cliente/ClienteStats";
import { ClienteFilters } from "@/components/Titular/Cliente/ClienteFilters";
import { ClienteTable } from "@/components/Titular/Cliente/ClienteTable";
import { ClienteCards } from "@/components/Titular/Cliente/ClienteCards";

import { useClientes } from "@/hooks/queries/useClientes";

export default function ClientesPage() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [planoFilter, setPlanoFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data, isLoading } = useClientes({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: statusFilter,
    plano: planoFilter,
  });

  const clientes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleNewClient = () => router.push("/painel/cliente/cadastro");

  const handleExportClients = () => {
    const csv = [
      [
        "Nome",
        "Email",
        "Telefone",
        "CPF",
        "Plano",
        "Status",
        "Valor",
        "Data Contratação",
      ].join(","),
      ...clientes.map((c) =>
        [
          c.nome,
          c.email,
          c.telefone,
          c.cpf,
          c.plano?.nome ?? "-",
          c.statusPlano,
          c.plano?.valorMensal ?? "-",
          c.dataContratacao,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: clientes.length,
    ativos: clientes.filter((c) => c.statusPlano === "Ativo").length,
    pendentes: clientes.filter((c) => c.statusPlano === "Pendente").length,
    inadimplentes: clientes.filter((c) => c.statusPlano === "Inadimplente")
      .length,
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <ClienteHeader
        onExport={handleExportClients}
        onNewClient={handleNewClient}
      />
      <ClienteStats stats={stats} />
      <ClienteFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        planoFilter={planoFilter}
        setPlanoFilter={setPlanoFilter}
        clientes={clientes}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {isLoading ? (
        <Card className="border border-gray-200 rounded-lg hover:shadow-md transition">
          <CardContent className="p-12 text-center">
            <p>Carregando clientes...</p>
          </CardContent>
        </Card>
      ) : clientes.length === 0 ? (
        <Card className="border border-gray-200 rounded-lg hover:shadow-md transition">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Tente ajustar os filtros ou cadastre um novo cliente
            </p>
            <Button
              onClick={handleNewClient}
              className="bg-green-600 hover:bg-green-700"
            >
              Cadastrar Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Mostrando {clientes.length} clientes
            </p>
            {selectedClientes.length > 0 && (
              <Alert className="w-auto">
                <AlertDescription>
                  {selectedClientes.length} cliente(s) selecionado(s)
                </AlertDescription>
              </Alert>
            )}
          </div>

          {viewMode === "table" ? (
            <ClienteTable
              clientes={clientes}
              selectedClientes={selectedClientes}
              setSelectedClientes={setSelectedClientes}
            />
          ) : (
            <ClienteCards clientes={clientes} />
          )}

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Próximo
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
