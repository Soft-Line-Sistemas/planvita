"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ClienteHeader } from "@/components/Titular/Cliente/ClienteHeader";
import { ClienteStats } from "@/components/Titular/Cliente/ClienteStats";
import { ClienteFilters } from "@/components/Titular/Cliente/ClienteFilters";
import { ClienteTable } from "@/components/Titular/Cliente/ClienteTable";
import { ClienteCards } from "@/components/Titular/Cliente/ClienteCards";
import { ClienteEditDialog } from "@/components/Titular/Cliente/ClienteEditDialog";
import { useAuth } from "@/hooks/useAuth";

import { useClientes } from "@/hooks/queries/useClientes";
import api from "@/utils/api";
import { sanitizePlanoArray } from "@/utils/planos";
import type { Plano } from "@/types/PlanType";
import type { Cliente } from "@/types/ClientType";

export default function ClientesPage() {
  const router = useRouter();
  const { hasPermission, user } = useAuth();
  const canViewClientes = hasPermission("titular.view");
  const canCreateClient = hasPermission("titular.create");

  const consultorLink = useMemo(() => {
    if (!user) return undefined;

    // Verifica se é consultor pelo nome da role
    const isConsultor = user.role?.name?.toLowerCase() === "consultor";

    if (isConsultor && typeof window !== "undefined") {
      return `${window.location.origin}/cliente/cadastro?consultorId=${user.id}`;
    }
    return undefined;
  }, [user]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [planoFilter, setPlanoFilter] = useState("todos");
  const viewModeStorageKey = "painel-clientes-view-mode";
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    if (typeof window === "undefined") return "table";
    const stored = window.localStorage.getItem(viewModeStorageKey);
    return stored === "cards" ? "cards" : "table";
  });
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const itemsPerPage = 10;

  const { data, isLoading, refetch } = useClientes({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: statusFilter,
    plano: planoFilter,
    enabled: canViewClientes,
  });

  const clientes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const {
    data: planosDetalhados,
    isLoading: isLoadingPlanos,
    isError: isErrorPlanos,
  } = useQuery<Plano[]>({
    queryKey: ["planos", "clientes"],
    queryFn: async () => {
      const response = await api.get("/plano");
      return sanitizePlanoArray(response.data);
    },
    staleTime: 60_000,
    enabled: canViewClientes,
  });

  const planoSelecionadoInfo = useMemo(() => {
    if (planoFilter === "todos") return null;
    if (!planosDetalhados || planosDetalhados.length === 0) return null;
    return planosDetalhados.find(
      (plano) => plano.nome.toLowerCase() === planoFilter.toLowerCase(),
    );
  }, [planoFilter, planosDetalhados]);

  const handleNewClient = () => router.push("/painel/cliente/cadastro");
  const handleEditCliente = (cliente: Cliente) => {
    setClienteEmEdicao(cliente);
    setEditOpen(true);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(viewModeStorageKey, viewMode);
  }, [viewMode, viewModeStorageKey]);

  if (!canViewClientes) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            Você não tem permissão para visualizar clientes.
          </CardContent>
        </Card>
      </div>
    );
  }

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
        consultorLink={consultorLink}
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
      {planoFilter !== "todos" && (
        <Card className="border border-emerald-200 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 uppercase tracking-wide">
                  Plano selecionado
                </p>
                <h2 className="text-xl font-semibold text-gray-900">
                  {planoFilter}
                </h2>
              </div>
              {isLoadingPlanos && (
                <span className="text-sm text-gray-500">
                  Carregando informações...
                </span>
              )}
            </div>
            {isErrorPlanos ? (
              <p className="text-sm text-red-600">
                Não foi possível carregar os dados do plano.
              </p>
            ) : planoSelecionadoInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-xs text-gray-500 uppercase">
                    Valor mensal
                  </p>
                  <p className="font-medium">
                    {`R$ ${Number(
                      planoSelecionadoInfo.valorMensal ?? 0,
                    ).toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">
                    Carência (dias)
                  </p>
                  <p className="font-medium">
                    {planoSelecionadoInfo.carenciaDias ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">
                    Vigência (meses)
                  </p>
                  <p className="font-medium">
                    {planoSelecionadoInfo.vigenciaMeses ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">
                    Idade máxima
                  </p>
                  <p className="font-medium">
                    {planoSelecionadoInfo.idadeMaxima
                      ? `${planoSelecionadoInfo.idadeMaxima} anos`
                      : "Sem limite"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Plano não encontrado na lista de planos cadastrados.
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
            {canCreateClient && (
              <Button
                onClick={handleNewClient}
                className="bg-green-600 hover:bg-green-700"
              >
                Cadastrar Cliente
              </Button>
            )}
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
              onEdit={handleEditCliente}
            />
          ) : (
            <ClienteCards clientes={clientes} onEdit={handleEditCliente} />
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
      {clienteEmEdicao && (
        <ClienteEditDialog
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setClienteEmEdicao(null);
          }}
          cliente={clienteEmEdicao}
          onUpdated={() => {
            void refetch();
            setEditOpen(false);
            setClienteEmEdicao(null);
          }}
        />
      )}
    </div>
  );
}
