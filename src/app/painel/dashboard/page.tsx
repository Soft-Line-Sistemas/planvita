"use client";
import { useState, useEffect } from "react";
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

// Tipagem
interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  plano: string;
  status: "Ativo" | "Pendente" | "Inativo";
  dataContrato: string;
  valor: number;
}

interface Stats {
  totalClientes: number;
  novosClientesMes: number;
  receitaMensal: number;
  crescimentoMensal: number;
}

interface MockData {
  stats: Stats;
  clientesRecentes: Cliente[];
}

interface DashboardProps {
  userEmail: string;
  onViewClient?: (id: number) => void;
}

// Mock data
const mockData: MockData = {
  stats: {
    totalClientes: 1247,
    novosClientesMes: 89,
    receitaMensal: 156780.5,
    crescimentoMensal: 12.5,
  },
  clientesRecentes: [
    {
      id: 1,
      nome: "Maria Silva Santos",
      email: "maria.silva@email.com",
      telefone: "(71) 99999-1234",
      plano: "Familiar Premium",
      status: "Ativo",
      dataContrato: "2024-10-05",
      valor: 299.9,
    },
    {
      id: 2,
      nome: "João Carlos Oliveira",
      email: "joao.carlos@email.com",
      telefone: "(71) 98888-5678",
      plano: "Individual Plus",
      status: "Pendente",
      dataContrato: "2024-10-04",
      valor: 189.9,
    },
    {
      id: 3,
      nome: "Ana Paula Ferreira",
      email: "ana.paula@email.com",
      telefone: "(71) 97777-9012",
      plano: "Familiar Básico",
      status: "Ativo",
      dataContrato: "2024-10-03",
      valor: 199.9,
    },
  ],
};

export default function Dashboard({ userEmail, onViewClient }: DashboardProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  const getStatusColor = (status: Cliente["status"]) => {
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
            {currentTime.toLocaleString("pt-BR")}
          </div>
          <Button className="bg-green-600 hover:bg-green-700 hover-lift text-white">
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
              {mockData.stats.totalClientes.toLocaleString("pt-BR")}
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
              {mockData.stats.novosClientesMes}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />+
              {mockData.stats.crescimentoMensal}% vs mês anterior
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
              {formatCurrency(mockData.stats.receitaMensal)}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />+
              {mockData.stats.crescimentoMensal}% vs mês anterior
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
            <div className="text-2xl font-bold text-gray-900">87.3%</div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.1% vs mês anterior
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
              onClick={() => router.push("/clientes")}
            >
              Ver Todos
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockData.clientesRecentes.map((cliente, index) => (
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
                    {formatDate(cliente.dataContrato)}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewClient && onViewClient(cliente.id)}
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
    </div>
  );
}
