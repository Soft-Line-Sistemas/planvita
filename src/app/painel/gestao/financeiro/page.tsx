"use client";
import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  FileText,
  Send,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Pagamento, StatusPagamento } from "@/types/PaymentType";

const GestaoFinanceira = () => {
  const router = useRouter();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("pagamentos");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroData, setFiltroData] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] =
    useState<Pagamento | null>(null);

  useEffect(() => {
    // Simular dados de pagamentos baseado nas imagens fornecidas
    const pagamentosSimulados: Pagamento[] = [
      {
        id: "1",
        cliente: {
          id: "1",
          nome: "Leonardo De Queiroz Silva",
          email: "leonardo@email.com",
          telefone: "(71) 99999-1234",
          cpf: "025.775.565-94",
          plano: "Bosque Plus",
        },
        valor: 79.9,
        dataVencimento: "2024-10-30",
        dataPagamento: null,
        status: "PENDENTE",
        metodoPagamento: "Boleto",
        referencia: "BOL202410001",
        diasAtraso: 0,
        observacoes: "Mensalidade de outubro/2024",
      },
      {
        id: "2",
        cliente: {
          id: "1",
          nome: "Leonardo De Queiroz Silva",
          email: "leonardo@email.com",
          telefone: "(71) 99999-1234",
          cpf: "025.775.565-94",
          plano: "Bosque Plus",
        },
        valor: 79.9,
        dataVencimento: "2024-09-30",
        dataPagamento: "2024-09-28",
        status: "PAGO",
        metodoPagamento: "PIX",
        referencia: "PIX202409001",
        diasAtraso: 0,
        observacoes: "Mensalidade de setembro/2024",
      },
      {
        id: "3",
        cliente: {
          id: "2",
          nome: "Maria Silva Santos",
          email: "maria.silva@email.com",
          telefone: "(71) 98888-5678",
          cpf: "123.456.789-00",
          plano: "Bosque Família",
        },
        valor: 89.9,
        dataVencimento: "2024-10-15",
        dataPagamento: null,
        status: "VENCIDO",
        metodoPagamento: "Boleto",
        referencia: "BOL202410002",
        diasAtraso: 15,
        observacoes: "Mensalidade de outubro/2024 - VENCIDA",
      },
      {
        id: "4",
        cliente: {
          id: "3",
          nome: "João Carlos Oliveira",
          email: "joao.carlos@email.com",
          telefone: "(71) 97777-9999",
          cpf: "987.654.321-11",
          plano: "Bosque Premium",
        },
        valor: 129.9,
        dataVencimento: "2024-11-05",
        dataPagamento: null,
        status: "PENDENTE",
        metodoPagamento: "Cartão de Crédito",
        referencia: "CC202411001",
        diasAtraso: 0,
        observacoes: "Mensalidade de novembro/2024",
      },
      {
        id: "5",
        cliente: {
          id: "4",
          nome: "Ana Paula Costa",
          email: "ana.paula@email.com",
          telefone: "(71) 96666-8888",
          cpf: "456.789.123-22",
          plano: "Bosque Social",
        },
        valor: 49.99,
        dataVencimento: "2024-10-20",
        dataPagamento: null,
        status: "VENCIDO",
        metodoPagamento: "Boleto",
        referencia: "BOL202410003",
        diasAtraso: 10,
        observacoes: "Mensalidade de outubro/2024 - VENCIDA",
      },
    ];

    setTimeout(() => {
      setPagamentos(pagamentosSimulados);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: StatusPagamento) => {
    switch (status) {
      case "PAGO":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-100",
        };
      case "PENDENTE":
        return { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" };
      case "VENCIDO":
        return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" };
      case "CANCELADO":
        return { icon: XCircle, color: "text-gray-600", bg: "bg-gray-100" };
      default:
        return { icon: Clock, color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  const pagamentosFiltrados = pagamentos.filter((pagamento) => {
    const matchSearch =
      pagamento.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.cliente.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      pagamento.referencia.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      filtroStatus === "todos" || pagamento.status === filtroStatus;

    let matchData = true;
    if (filtroData !== "todos") {
      const hoje = new Date();
      const dataVencimento = new Date(pagamento.dataVencimento);

      switch (filtroData) {
        case "vencendo": {
          const diasParaVencer = Math.ceil(
            (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
          );
          matchData = diasParaVencer <= 7 && diasParaVencer >= 0;
          break;
        }
        case "vencidos":
          matchData = dataVencimento < hoje && pagamento.status !== "PAGO";
          break;
        case "mes_atual":
          matchData =
            dataVencimento.getMonth() === hoje.getMonth() &&
            dataVencimento.getFullYear() === hoje.getFullYear();
          break;
        default:
          matchData = true;
      }
    }

    return matchSearch && matchStatus && matchData;
  });

  const estatisticas = {
    totalPagamentos: pagamentos.length,
    pagamentosPendentes: pagamentos.filter((p) => p.status === "PENDENTE")
      .length,
    pagamentosVencidos: pagamentos.filter((p) => p.status === "VENCIDO").length,
    pagamentosPagos: pagamentos.filter((p) => p.status === "PAGO").length,
    valorTotalPendente: pagamentos
      .filter((p) => p.status === "PENDENTE")
      .reduce((sum, p) => sum + p.valor, 0),
    valorTotalVencido: pagamentos
      .filter((p) => p.status === "VENCIDO")
      .reduce((sum, p) => sum + p.valor, 0),
    valorTotalRecebido: pagamentos
      .filter((p) => p.status === "PAGO")
      .reduce((sum, p) => sum + p.valor, 0),
  };

  const handleVisualizarPagamento = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setModalAberto(true);
  };

  const handleConfirmarPagamento = (pagamentoId: string) => {
    setPagamentos((prev) =>
      prev.map((p) =>
        p.id === pagamentoId
          ? {
              ...p,
              status: "PAGO",
              dataPagamento: new Date().toISOString().split("T")[0],
            }
          : p,
      ),
    );
  };

  const abas = [
    { id: "pagamentos", nome: "Pagamentos", icon: CreditCard },
    { id: "inadimplencia", nome: "Inadimplência", icon: AlertCircle },
    { id: "relatorios", nome: "Relatórios", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Gestão Financeira
                </h1>
                <p className="text-sm text-gray-500">
                  Gerencie pagamentos, boletos e inadimplência
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Enviar Boletos</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {abas.map((aba) => {
              const Icon = aba.icon;
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    abaAtiva === aba.id
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{aba.nome}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-green-600">
                  {estatisticas.pagamentosPagos}
                </p>
                <p className="text-sm text-gray-500">
                  R$ {estatisticas.valorTotalRecebido.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {estatisticas.pagamentosPendentes}
                </p>
                <p className="text-sm text-gray-500">
                  R$ {estatisticas.valorTotalPendente.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">
                  {estatisticas.pagamentosVencidos}
                </p>
                <p className="text-sm text-gray-500">
                  R$ {estatisticas.valorTotalVencido.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {estatisticas.totalPagamentos}
                </p>
                <p className="text-sm text-gray-500">
                  R${" "}
                  {(
                    estatisticas.valorTotalRecebido +
                    estatisticas.valorTotalPendente +
                    estatisticas.valorTotalVencido
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {abaAtiva === "pagamentos" && (
          <>
            {/* Filtros e Busca */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, email ou referência..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="PAGO">Pagos</option>
                      <option value="PENDENTE">Pendentes</option>
                      <option value="VENCIDO">Vencidos</option>
                      <option value="CANCELADO">Cancelados</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <select
                      value={filtroData}
                      onChange={(e) => setFiltroData(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="todos">Todas as Datas</option>
                      <option value="vencendo">Vencendo em 7 dias</option>
                      <option value="vencidos">Vencidos</option>
                      <option value="mes_atual">Mês Atual</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Pagamentos */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pagamentos ({pagamentosFiltrados.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagamentosFiltrados.map((pagamento) => {
                      const StatusIcon = getStatusColor(pagamento.status).icon;
                      return (
                        <tr key={pagamento.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {pagamento.cliente.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {pagamento.cliente.plano}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              R$ {pagamento.valor.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(
                                pagamento.dataVencimento,
                              ).toLocaleDateString("pt-BR")}
                            </div>
                            {pagamento.diasAtraso > 0 && (
                              <div className="text-sm text-red-600">
                                {pagamento.diasAtraso} dias de atraso
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <StatusIcon
                                className={`w-4 h-4 ${getStatusColor(pagamento.status).color}`}
                              />
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pagamento.status).bg} ${getStatusColor(pagamento.status).color}`}
                              >
                                {pagamento.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {pagamento.metodoPagamento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handleVisualizarPagamento(pagamento)
                                }
                                className="text-blue-600 hover:text-blue-800"
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {pagamento.status === "PENDENTE" && (
                                <button
                                  onClick={() =>
                                    handleConfirmarPagamento(pagamento.id)
                                  }
                                  className="text-green-600 hover:text-green-800"
                                  title="Confirmar Pagamento"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                className="text-gray-600 hover:text-gray-800"
                                title="Baixar Boleto"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {abaAtiva === "inadimplencia" && (
          <div className="space-y-6">
            {/* Clientes Inadimplentes */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Clientes Inadimplentes
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {pagamentos
                    .filter((p) => p.status === "VENCIDO")
                    .map((pagamento) => (
                      <div
                        key={pagamento.id}
                        className="border border-red-200 rounded-lg p-4 bg-red-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {pagamento.cliente.nome}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {pagamento.cliente.email}
                              </p>
                              <p className="text-sm text-gray-600">
                                {pagamento.cliente.telefone}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-red-600">
                              R$ {pagamento.valor.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Venceu em{" "}
                              {new Date(
                                pagamento.dataVencimento,
                              ).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-sm text-red-600 font-medium">
                              {pagamento.diasAtraso} dias de atraso
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>Ligar</span>
                            </button>
                            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "relatorios" && (
          <div className="space-y-6">
            {/* Relatórios Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Receita Mensal
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Outubro 2024</span>
                    <span className="font-semibold text-green-600">
                      R$ 15.847,20
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Setembro 2024</span>
                    <span className="font-semibold">R$ 14.523,80</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Agosto 2024</span>
                    <span className="font-semibold">R$ 13.892,40</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        +9.1% vs mês anterior
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Taxa de Inadimplência
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Outubro 2024</span>
                    <span className="font-semibold text-red-600">8.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Setembro 2024</span>
                    <span className="font-semibold">7.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Agosto 2024</span>
                    <span className="font-semibold">6.8%</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 text-red-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        +1.3% vs mês anterior
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações de Relatório */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gerar Relatórios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <FileText className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-medium">Relatório de Pagamentos</h4>
                  <p className="text-sm text-gray-600">
                    Exportar lista completa de pagamentos
                  </p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
                  <h4 className="font-medium">Relatório de Inadimplência</h4>
                  <p className="text-sm text-gray-600">
                    Lista de clientes em atraso
                  </p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                  <h4 className="font-medium">Relatório Financeiro</h4>
                  <p className="text-sm text-gray-600">
                    Resumo financeiro mensal
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Pagamento */}
      {modalAberto && pagamentoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes do Pagamento
                </h3>
                <button
                  onClick={() => setModalAberto(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações do Cliente */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Informações do Cliente
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nome</label>
                    <p className="font-medium">
                      {pagamentoSelecionado.cliente.nome}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">CPF</label>
                    <p className="font-medium">
                      {pagamentoSelecionado.cliente.cpf}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium">
                      {pagamentoSelecionado.cliente.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Telefone</label>
                    <p className="font-medium">
                      {pagamentoSelecionado.cliente.telefone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações do Pagamento */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Informações do Pagamento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Valor</label>
                    <p className="font-medium text-lg">
                      R$ {pagamentoSelecionado.valor.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <div className="flex items-center space-x-2">
                      {React.createElement(
                        getStatusColor(pagamentoSelecionado.status).icon,
                        {
                          className: `w-4 h-4 ${getStatusColor(pagamentoSelecionado.status).color}`,
                        },
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pagamentoSelecionado.status).bg} ${getStatusColor(pagamentoSelecionado.status).color}`}
                      >
                        {pagamentoSelecionado.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Data de Vencimento
                    </label>
                    <p className="font-medium">
                      {new Date(
                        pagamentoSelecionado.dataVencimento,
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Método de Pagamento
                    </label>
                    <p className="font-medium">
                      {pagamentoSelecionado.metodoPagamento}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Referência</label>
                    <p className="font-medium">
                      {pagamentoSelecionado.referencia}
                    </p>
                  </div>
                  {pagamentoSelecionado.dataPagamento && (
                    <div>
                      <label className="text-sm text-gray-600">
                        Data de Pagamento
                      </label>
                      <p className="font-medium">
                        {new Date(
                          pagamentoSelecionado.dataPagamento,
                        ).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {pagamentoSelecionado.observacoes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Observações
                  </h4>
                  <p className="text-gray-700">
                    {pagamentoSelecionado.observacoes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Baixar Boleto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoFinanceira;
