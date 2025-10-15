"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Cliente } from "@/types/ClientType";

// Mock data simplificado e compatível com ClientType
const mockClientes: Cliente[] = [
  {
    id: "1",
    nome: "Maria Silva Santos",
    cpf: "123.456.789-01",
    email: "maria.silva@email.com",
    telefone: "(71) 99999-1234",
    dataNascimento: "1985-05-15",
    idade: 39,
    endereco: {
      cep: "40000-000",
      uf: "BA",
      cidade: "Salvador",
      bairro: "Centro",
      logradouro: "Rua das Palmeiras",
      numero: "123",
    },
    statusPlano: "Ativo",
    dataContratacao: "2024-01-15",
    dataCarencia: "2024-02-15",
    carenciaRestante: 0,
    diaVencimento: 15,
    plano: {
      id: "P001",
      nome: "Bosque Família",
      valorMensal: 89.9,
      coberturas: {
        servicosPadrao: [],
        coberturaTranslado: [],
        servicosEspecificos: [],
      },
    },
    consultor: {
      nome: "Carlos Pereira",
      codigo: "C001",
      email: "carlos@empresa.com",
      telefone: "(71) 98888-0000",
    },
    dependentes: [],
    pagamentos: [
      {
        id: "PG01",
        valor: 89.9,
        dataVencimento: "2024-11-15",
        status: "PAGO",
        metodoPagamento: "PIX",
      },
    ],
  },
];

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes);
  const [filteredClientes, setFilteredClientes] =
    useState<Cliente[]>(mockClientes);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [planoFilter, setPlanoFilter] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Carregar clientes do localStorage
  useEffect(() => {
    const savedClientes = localStorage.getItem("planvita_clientes");
    if (savedClientes) {
      const parsedClientes = JSON.parse(savedClientes) as Cliente[];
      setClientes([...mockClientes, ...parsedClientes]);
      setFilteredClientes([...mockClientes, ...parsedClientes]);
    }
  }, []);

  // Filtro de clientes
  useEffect(() => {
    let filtered = clientes;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.cpf.includes(searchTerm) ||
          c.telefone.includes(searchTerm),
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter((c) => c.statusPlano === statusFilter);
    }

    if (planoFilter !== "todos") {
      filtered = filtered.filter((c) => c.plano.nome === planoFilter);
    }

    setFilteredClientes(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, planoFilter, clientes]);

  const getStatusColor = (status: Cliente["statusPlano"]) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Inativo":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Inadimplente":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Cliente["statusPlano"]) => {
    switch (status) {
      case "Ativo":
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case "Pendente":
        return <Clock className="w-3 h-3 mr-1" />;
      case "Inadimplente":
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      default:
        return <AlertCircle className="w-3 h-3 mr-1" />;
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  const handleViewClient = (clientId: string) =>
    router.push(`/painel/cliente/${clientId}/detalhes`);
  const handleEditClient = (clientId: string) =>
    router.push(`/painel/cliente/${clientId}/editar`);
  const handleDeleteClient = (clientId: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      const updated = clientes.filter((c) => c.id !== clientId);
      setClientes(updated);
      localStorage.setItem("planvita_clientes", JSON.stringify(updated));
    }
  };

  const handleNewClient = () => router.push("/painel/cliente/cadastro");

  const handleExportClients = () => {
    const csvContent = [
      [
        "Nome",
        "Email",
        "Telefone",
        "CPF",
        "Plano",
        "Status",
        "Valor Mensal",
        "Data Contratação",
      ].join(","),
      ...filteredClientes.map((c) =>
        [
          c.nome,
          c.email,
          c.telefone,
          c.cpf,
          c.plano.nome,
          c.statusPlano,
          c.plano.valorMensal,
          c.dataContratacao,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes_planvita.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Paginação
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClientes = filteredClientes.slice(startIndex, endIndex);

  const uniquePlanos = Array.from(new Set(clientes.map((c) => c.plano.nome)));

  const stats = {
    total: clientes.length,
    ativos: clientes.filter((c) => c.statusPlano === "Ativo").length,
    pendentes: clientes.filter((c) => c.statusPlano === "Pendente").length,
    inadimplentes: clientes.filter((c) => c.statusPlano === "Inadimplente")
      .length,
  };

  // Render Table View
  const renderTableView = () => (
    <Card className="animate-fade-in">
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedClientes.length === currentClientes.length}
                  onChange={(e) =>
                    setSelectedClientes(
                      e.target.checked ? currentClientes.map((c) => c.id) : [],
                    )
                  }
                />
              </TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Dependentes</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentClientes.map((c) => (
              <TableRow key={c.id} className="hover:bg-gray-50">
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedClientes.includes(c.id)}
                    onChange={(e) =>
                      setSelectedClientes(
                        e.target.checked
                          ? [...selectedClientes, c.id]
                          : selectedClientes.filter((id) => id !== c.id),
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{c.nome}</div>
                  <div className="text-sm text-gray-500">{c.cpf}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm space-y-1">
                    <div className="flex items-center">
                      <Mail className="w-3 h-3 mr-1 text-gray-400" />
                      {c.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-gray-400" />
                      {c.telefone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{c.plano.nome}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(c.statusPlano)}>
                    {getStatusIcon(c.statusPlano)} {c.statusPlano}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(c.plano.valorMensal)}</TableCell>
                <TableCell>{formatDate(c.dataContratacao)}</TableCell>
                <TableCell>{c.dependentes.length}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewClient(c.id)}>
                        <Eye className="w-4 h-4 mr-2" /> Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClient(c.id)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClient(c.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Render Cards View
  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {currentClientes.map((c, i) => (
        <Card
          key={c.id}
          className="hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <CardHeader className="pb-3 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{c.nome}</CardTitle>
                <p className="text-sm text-gray-500">{c.cpf}</p>
              </div>
            </div>
            <Badge className={getStatusColor(c.statusPlano)}>
              {getStatusIcon(c.statusPlano)} {c.statusPlano}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-2 text-gray-400" /> {c.email}
              </div>
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-400" /> {c.telefone}
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-gray-100 py-2">
              <div>
                <p className="text-sm text-gray-500">Plano</p>
                <p className="font-medium">{c.plano.nome}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Valor</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(c.plano.valorMensal)}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Dependentes</p>
                <p className="font-medium">{c.dependentes.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Vencimento</p>
                <p className="font-medium">{formatDate(c.dataContratacao)}</p>
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewClient(c.id)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" /> Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditClient(c.id)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" /> Editar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 animate-fade-in">
            Gestão de Clientes
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os clientes e seus contratos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            variant="outline"
            onClick={handleExportClients}
            className="hover:bg-gray-100"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
          <Button
            onClick={handleNewClient}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.ativos}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pendentes}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Inadimplentes</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.inadimplentes}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, email, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
              <SelectItem value="Inadimplente">Inadimplente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planoFilter} onValueChange={setPlanoFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Planos</SelectItem>
              {uniquePlanos.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-r-none"
            >
              Tabela
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-l-none"
            >
              Cards
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== "todos" || planoFilter !== "todos"
                ? "Tente ajustar os filtros"
                : "Comece cadastrando seu primeiro cliente"}
            </p>
            <Button
              onClick={handleNewClient}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Cadastrar Primeiro Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(endIndex, filteredClientes.length)} de{" "}
              {filteredClientes.length} clientes
            </p>
            {selectedClientes.length > 0 && (
              <Alert className="w-auto">
                <AlertDescription>
                  {selectedClientes.length} cliente(s) selecionado(s)
                </AlertDescription>
              </Alert>
            )}
          </div>
          {viewMode === "table" ? renderTableView() : renderCardsView()}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={currentPage === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(p)}
                  className="w-10"
                >
                  {p}
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
