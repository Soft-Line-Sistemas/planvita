"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  DollarSign,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import ModalCliente from "@/components/ui/ModalCliente";
import { Cliente as ClienteType } from "@/types/ClientType";
import { Pagamento } from "@/types/PaymentType";
import { useClientes } from "@/hooks/queries/useClientes";
import { usePagamentos } from "@/hooks/queries/usePagamentos";

type DashboardCliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  plano: string;
  status: "Ativo" | "Pendente" | "Inativo";
  dataContrato: string;
  valor: number;
};

interface DashboardProps {
  userEmail?: string;
  onViewClient?: (id: string) => void;
}

const statusPlanoToDashboard = (
  status?: string | null,
): DashboardCliente["status"] => {
  const normalized = (status ?? "").toUpperCase();
  if (normalized.includes("PEND")) return "Pendente";
  if (normalized.includes("INAT")) return "Inativo";
  return "Ativo";
};

const mapClienteToDashboard = (cliente: ClienteType): DashboardCliente => ({
  id: String(cliente.id),
  nome: cliente.nome,
  email: cliente.email,
  telefone: cliente.telefone,
  plano: cliente.plano?.nome ?? "Plano não informado",
  status: statusPlanoToDashboard(cliente.statusPlano),
  dataContrato: cliente.dataContratacao ?? "",
  valor: Number(cliente.plano?.valorMensal ?? 0),
});

const countClientesByMonth = (
  clientes: ClienteType[],
  year: number,
  month: number,
) => {
  return clientes.filter((cliente) => {
    if (!cliente.dataContratacao) return false;
    const data = new Date(cliente.dataContratacao);
    return (
      data.getFullYear() === year &&
      data.getMonth() === month &&
      !Number.isNaN(data.getTime())
    );
  }).length;
};

const calcularReceitaMensal = (
  pagamentos: Pagamento[],
  month: number,
  year: number,
) => {
  return pagamentos
    .filter((pagamento) => {
      if (pagamento.status !== "PAGO" || !pagamento.dataPagamento) return false;
      const data = new Date(pagamento.dataPagamento);
      return (
        data.getMonth() === month &&
        data.getFullYear() === year &&
        !Number.isNaN(data.getTime())
      );
    })
    .reduce((total, pagamento) => total + pagamento.valor, 0);
};

export default function Dashboard({ userEmail = "Operador" }: DashboardProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const { data: clientesData, isLoading: isLoadingClientes } = useClientes({
    page: 1,
    limit: 100,
    search: "",
    status: "todos",
    plano: "todos",
  });
  const { data: pagamentosData, isLoading: isLoadingPagamentos } =
    usePagamentos();
  const clientes = useMemo(() => clientesData?.data ?? [], [clientesData]);
  const totalClientes = clientesData?.total ?? clientes.length;
  const pagamentos = useMemo(() => pagamentosData ?? [], [pagamentosData]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dashboardClientes = useMemo(
    () => clientes.map(mapClienteToDashboard),
    [clientes],
  );

  const recentClientes = useMemo(() => {
    return [...dashboardClientes]
      .sort(
        (a, b) =>
          new Date(b.dataContrato).getTime() -
          new Date(a.dataContrato).getTime(),
      )
      .slice(0, 5);
  }, [dashboardClientes]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : (currentMonth - 1 + 12) % 12;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const novosClientesMes = useMemo(
    () => countClientesByMonth(clientes, currentYear, currentMonth),
    [clientes, currentMonth, currentYear],
  );

  const novosClientesMesAnterior = useMemo(
    () => countClientesByMonth(clientes, previousYear, previousMonth),
    [clientes, previousMonth, previousYear],
  );

  const crescimentoMensal =
    novosClientesMesAnterior === 0
      ? novosClientesMes > 0
        ? 100
        : 0
      : Number(
          (
            ((novosClientesMes - novosClientesMesAnterior) /
              novosClientesMesAnterior) *
            100
          ).toFixed(1),
        );

  const receitaMensal = useMemo(
    () => calcularReceitaMensal(pagamentos, currentMonth, currentYear),
    [pagamentos, currentMonth, currentYear],
  );

  const totalAtivos = useMemo(
    () =>
      clientes.filter(
        (cliente) => (cliente.statusPlano ?? "").toUpperCase() === "ATIVO",
      ).length,
    [clientes],
  );

  const taxaConversao =
    totalClientes > 0
      ? Number(((totalAtivos / totalClientes) * 100).toFixed(1))
      : 0;

  const isLoadingData = isLoadingClientes || isLoadingPagamentos;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  const getStatusColor = (status: DashboardCliente["status"]) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Inativo":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  const [selectedCliente, setSelectedCliente] =
    useState<DashboardCliente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewClient = (id: string) => {
    const cliente = recentClientes.find((item) => item.id === id) ?? null;
    if (cliente) {
      setSelectedCliente(cliente);
      setModalOpen(true);
    }
  };
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 animate-fade-in">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo de volta, <span className="font-medium">{userEmail}</span>
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            {mounted && currentTime.toLocaleString("pt-BR")}
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700 hover-lift text-white"
            onClick={() => router.push("/painel/cliente/cadastro")}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover animate-slide-in-right">
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Clientes
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {isLoadingData ? "—" : totalClientes.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-gray-500 mt-1">Base ativa de clientes</p>
          </CardContent>
        </Card>

        <Card
          className="card-hover animate-slide-in-right"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Novos este Mês
            </CardTitle>
            <UserPlus className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {isLoadingData ? "—" : novosClientesMes}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {isLoadingData ? "—" : `${crescimentoMensal}% vs mês anterior`}
            </p>
          </CardContent>
        </Card>

        <Card
          className="card-hover animate-slide-in-right"
          style={{ animationDelay: "0.2s" }}
        >
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {isLoadingData ? "—" : formatCurrency(receitaMensal)}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {isLoadingData ? "—" : `${crescimentoMensal}% vs mês anterior`}
            </p>
          </CardContent>
        </Card>

        <Card
          className="card-hover animate-slide-in-right"
          style={{ animationDelay: "0.3s" }}
        >
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taxa de Conversão
            </CardTitle>
            <Activity className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {isLoadingData ? "—" : `${taxaConversao}%`}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isLoadingData
                ? "Calculando clientes ativos..."
                : `${totalAtivos} clientes ativos`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Clientes Recentes
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/painel/cliente")}
            >
              Ver Todos
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingData && (
              <p className="text-sm text-gray-500">Carregando clientes...</p>
            )}

            {!isLoadingData && recentClientes.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhum cliente cadastrado recentemente.
              </p>
            )}

            {!isLoadingData &&
              recentClientes.map((cliente, index) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-1 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {cliente.nome}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {cliente.telefone}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {cliente.plano}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(cliente.valor)}
                      </div>
                    </div>

                    <Badge className={getStatusColor(cliente.status)}>
                      {cliente.status === "Ativo" && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {cliente.status === "Pendente" && (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {cliente.status}
                    </Badge>

                    <div className="text-sm text-gray-500">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {cliente.dataContrato
                        ? formatDate(cliente.dataContrato)
                        : "—"}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewClient(cliente.id)}
                      className="ml-2"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <ModalCliente
        cliente={selectedCliente}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
