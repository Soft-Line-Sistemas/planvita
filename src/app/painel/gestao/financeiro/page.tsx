"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  MessageCircle,
  Mail,
  User,
  Loader2,
} from "lucide-react";
import { Pagamento, StatusPagamento } from "@/types/PaymentType";
import CadastroFinanceiro from "@/components/Financeiro/cadastroFinanceiro";
import ContasFinanceiro from "@/components/Financeiro/contasFinanceiro";
import RelatorioFinanceiro from "@/components/Financeiro/relatorioFinanceiro";
import { usePagamentos } from "@/hooks/queries/usePagamentos";
import { useAtualizarStatusPagamento } from "@/hooks/mutations/useAtualizarStatusPagamento";
import getTenantFromHost from "@/utils/getTenantFromHost";
import AsaasPaymentsPanel from "@/components/Financeiro/AsaasPaymentsPanel";
import { useContasFinanceiras } from "@/hooks/queries/useContasFinanceiras";
import { getDiasAtraso } from "@/types/Financeiro";
import { useRelatorioFinanceiro } from "@/hooks/queries/useRelatorioFinanceiro";
import { gerarBoletoPDF } from "@/utils/boleto";
// import { MetricasRecorrencia } from "@/components/Financeiro/metricasRecorrencia";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AsaasWingsMark from "@/components/ui/AsaasWingsMark";
import { useFinanceiroClientes } from "@/hooks/queries/useFinanceiroClientes";
import { useCriarContaFinanceira } from "@/hooks/mutations/useContaFinanceiraMutations";

const GestaoFinanceira = () => {
  const {
    data: pagamentosData,
    isLoading,
    isError,
    error,
    refetch,
  } = usePagamentos();
  const pagamentos = useMemo(() => pagamentosData ?? [], [pagamentosData]);
  const atualizarStatusPagamento = useAtualizarStatusPagamento();
  const {
    data: contasFinanceiras,
    isLoading: isLoadingContas,
    isError: isErrorContas,
    error: contasError,
  } = useContasFinanceiras();
  const contasReceber = useMemo(
    () => (contasFinanceiras ?? []).filter((conta) => conta.tipo === "Receber"),
    [contasFinanceiras],
  );
  const inadimplentes = useMemo(() => {
    const hoje = new Date();
    return contasReceber
      .filter((conta) => {
        const vencimento = new Date(conta.dataVencimento);
        return (
          vencimento < hoje &&
          (conta.status === "PENDENTE" ||
            conta.status === "ATRASADO" ||
            conta.status === "VENCIDO")
        );
      })
      .sort(
        (a, b) =>
          new Date(b.dataVencimento).getTime() -
          new Date(a.dataVencimento).getTime(),
      );
  }, [contasReceber]);
  const totalValorInadimplente = useMemo(
    () => inadimplentes.reduce((acc, conta) => acc + conta.valor, 0),
    [inadimplentes],
  );
  const taxaInadimplencia = useMemo(() => {
    if (!contasReceber.length) return 0;
    return (inadimplentes.length / contasReceber.length) * 100;
  }, [contasReceber, inadimplentes]);
  const resumoCards = useMemo(() => {
    const lista = contasFinanceiras ?? [];
    const sum = (items: typeof lista) =>
      items.reduce((acc, conta) => acc + conta.valor, 0);

    const pagos = lista.filter(
      (conta) => conta.status === "PAGO" || conta.status === "RECEBIDO",
    );
    const pendentes = lista.filter((conta) => conta.status === "PENDENTE");
    const vencidos = lista.filter(
      (conta) => conta.status === "ATRASADO" || conta.status === "VENCIDO",
    );

    return {
      pagos: { quantidade: pagos.length, valor: sum(pagos) },
      pendentes: { quantidade: pendentes.length, valor: sum(pendentes) },
      vencidos: { quantidade: vencidos.length, valor: sum(vencidos) },
      total: { quantidade: lista.length, valor: sum(lista) },
    };
  }, [contasFinanceiras]);
  const { data: relatorioFinanceiro, isLoading: isLoadingRelatorio } =
    useRelatorioFinanceiro();
  const formatCurrency = (valor: number) =>
    `R$ ${valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const receitaMensalHighlights = useMemo(() => {
    const mensal = relatorioFinanceiro?.mensal ?? [];
    return [...mensal].reverse().slice(0, 4);
  }, [relatorioFinanceiro]);
  const [abaAtiva, setAbaAtiva] = useState("contas");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroData, setFiltroData] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] =
    useState<Pagamento | null>(null);
  const [tenant, setTenant] = useState<string | null>(null);

  useEffect(() => {
    setTenant(getTenantFromHost());
  }, []);

  const isBosqueTenant =
    typeof tenant === "string" && tenant.trim().toLowerCase() === "bosque";

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

  const handleVisualizarPagamento = (pagamento: Pagamento) => {
    setPagamentoSelecionado(pagamento);
    setModalAberto(true);
  };

  const handleConfirmarPagamento = (pagamento: Pagamento) => {
    if (pagamento.status === "PAGO") return;

    const numeroId = Number(pagamento.id);
    const payloadId = Number.isNaN(numeroId) ? pagamento.id : numeroId;

    atualizarStatusPagamento.mutate({
      id: payloadId,
      status: "PAGO",
      dataPagamento: new Date().toISOString(),
    });
  };

  const handleBaixarBoleto = (pagamento: Pagamento) => {
    gerarBoletoPDF(pagamento);
  };

  const abas = useMemo(() => {
    const base = [
      // { id: "pagamentos", nome: "Pagamentos", icon: CreditCard },
      { id: "inadimplencia", nome: "Inadimplência", icon: AlertCircle },
      { id: "relatorios", nome: "Relatórios", icon: FileText },
      { id: "cadastros", nome: "Cadastros", icon: TrendingUp },
      { id: "contas", nome: "Contas Financeiras", icon: DollarSign },
      {
        id: "relatoriosFinanceiro",
        nome: "Relatórios Financeiros",
        icon: FileText,
      },
      { id: "boletos", nome: "Boletos", icon: CreditCard },
    ];

    if (isBosqueTenant) {
      base.push({
        id: "asaas",
        nome: "Integração Asaas",
        icon: CreditCard,
      });
    }

    return base;
  }, [isBosqueTenant]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-gray-700 text-lg font-medium">
          Não foi possível carregar os pagamentos.
        </p>
        {error instanceof Error && (
          <p className="text-sm text-gray-500 max-w-md">
            Detalhes: {error.message}
          </p>
        )}
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Tentar novamente
        </button>
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
              {/* <button
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar
              </button> */}
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
                  {isLoadingContas ? (
                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                  ) : (
                    resumoCards.pagos.quantidade
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {isLoadingContas
                    ? "Carregando..."
                    : formatCurrency(resumoCards.pagos.valor)}
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
                  {isLoadingContas ? (
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                  ) : (
                    resumoCards.pendentes.quantidade
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {isLoadingContas
                    ? "Carregando..."
                    : formatCurrency(resumoCards.pendentes.valor)}
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
                  {isLoadingContas ? (
                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  ) : (
                    resumoCards.vencidos.quantidade
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {isLoadingContas
                    ? "Carregando..."
                    : formatCurrency(resumoCards.vencidos.valor)}
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
                  {isLoadingContas ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  ) : (
                    resumoCards.total.quantidade
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {isLoadingContas
                    ? "Carregando..."
                    : formatCurrency(resumoCards.total.valor)}
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
                                    handleConfirmarPagamento(pagamento)
                                  }
                                  className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={
                                    atualizarStatusPagamento.isPending &&
                                    (
                                      atualizarStatusPagamento.variables?.id ??
                                      ""
                                    ).toString() === pagamento.id
                                  }
                                  title="Confirmar Pagamento"
                                >
                                  {atualizarStatusPagamento.isPending &&
                                  (
                                    atualizarStatusPagamento.variables?.id ?? ""
                                  ).toString() === pagamento.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleBaixarBoleto(pagamento)}
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
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Clientes inadimplentes
                  </h3>
                  <p className="text-sm text-gray-500">
                    Dados consolidados diretamente das contas a receber
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total em atraso</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {totalValorInadimplente.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {inadimplentes.length}{" "}
                    {inadimplentes.length === 1 ? "registro" : "registros"}
                  </p>
                </div>
              </div>
              <div className="p-6">
                {isLoadingContas ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando contas a receber...
                  </div>
                ) : isErrorContas ? (
                  <div className="text-center text-red-600 space-y-2">
                    <p>Não foi possível carregar os dados financeiros.</p>
                    {contasError instanceof Error && (
                      <p className="text-sm text-red-500">
                        {contasError.message}
                      </p>
                    )}
                  </div>
                ) : inadimplentes.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Nenhum cliente em atraso no momento.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {inadimplentes.map((conta) => {
                      const diasAtraso = getDiasAtraso(conta);
                      const nomeCliente =
                        conta.cliente?.nome ?? conta.parceiro ?? "Cliente";
                      const email = conta.cliente?.email ?? conta.contato ?? "";
                      const telefone = conta.cliente?.telefone ?? "";
                      return (
                        <div
                          key={`${conta.id}-${conta.dataVencimento}`}
                          className="border border-red-200 rounded-lg p-4 bg-red-50"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {nomeCliente}
                                </h4>
                                {conta.cliente?.cpf && (
                                  <p className="text-xs text-gray-600">
                                    CPF: {conta.cliente.cpf}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  {email || "Sem e-mail informado"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {telefone || "Sem telefone informado"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">
                                R$ {conta.valor.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Venceu em{" "}
                                {new Date(
                                  conta.dataVencimento,
                                ).toLocaleDateString("pt-BR")}
                              </p>
                              <p className="text-sm text-red-600 font-medium">
                                {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"}{" "}
                                de atraso
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                disabled={!telefone}
                                className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${
                                  telefone
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                }`}
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </button>
                              <button
                                disabled={!email}
                                className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${
                                  email
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                }`}
                              >
                                <Mail className="w-3 h-3" />
                                <span>Email</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "relatorios" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Receita Mensal
                </h3>
                {isLoadingRelatorio ? (
                  <div className="flex items-center justify-center text-gray-500 gap-2 h-32">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Consolidando dados do relatório...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receitaMensalHighlights.map((item) => (
                      <div
                        key={item.mes}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-600">{item.mes}</span>
                        <span className="font-semibold text-green-600">
                          Entradas: R$ {item.entradas.toLocaleString("pt-BR")}
                        </span>
                        <span className="font-semibold text-red-500">
                          Saídas: R$ {item.saidas.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                    {relatorioFinanceiro?.totais && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center space-x-2 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Lucro acumulado: R${" "}
                            {relatorioFinanceiro.totais.lucro.toLocaleString(
                              "pt-BR",
                            )}{" "}
                            ({relatorioFinanceiro.totais.margem.toFixed(1)}%
                            margem)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Taxa de Inadimplência
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-4xl font-bold text-red-600">
                      {taxaInadimplencia.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {inadimplentes.length} clientes com {contasReceber.length}{" "}
                      contas abertas
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Valor em aberto</span>
                    <span className="font-semibold text-gray-900">
                      R$ {totalValorInadimplente.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Recebíveis monitorados
                    </span>
                    <span className="font-semibold text-gray-900">
                      R${" "}
                      {contasReceber
                        .reduce((acc, conta) => acc + conta.valor, 0)
                        .toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="pt-4 border-t text-xs text-gray-500">
                    Última atualização:{" "}
                    {new Date().toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gerar Relatórios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <FileText className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-medium">Relatório de Pagamentos</h4>
                  <p className="text-sm text-gray-600">
                    {pagamentos.length} pagamentos sincronizados com o backend
                  </p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
                  <h4 className="font-medium">Relatório de Inadimplência</h4>
                  <p className="text-sm text-gray-600">
                    {inadimplentes.length} clientes com contas em atraso
                  </p>
                </button>

                <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                  <h4 className="font-medium">Relatório Financeiro</h4>
                  <p className="text-sm text-gray-600">
                    {relatorioFinanceiro?.totais
                      ? `Entradas: R$ ${relatorioFinanceiro.totais.entradas.toLocaleString(
                          "pt-BR",
                        )}`
                      : "Sincronizando..."}
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
        {abaAtiva === "cadastros" && <CadastroFinanceiro />}
        {abaAtiva === "contas" && <ContasFinanceiro />}
        {abaAtiva === "relatoriosFinanceiro" && <RelatorioFinanceiro />}
        {abaAtiva === "asaas" && isBosqueTenant && <AsaasPaymentsPanel />}
        {abaAtiva === "boletos" && <BoletosEmissaoTab />}
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
              <button
                onClick={() => handleBaixarBoleto(pagamentoSelecionado)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
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

const BoletosEmissaoTab: React.FC = () => {
  const [buscaCliente, setBuscaCliente] = useState("");
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [previewConta, setPreviewConta] = useState<{
    clienteNome?: string | null;
    clienteCpf?: string | null;
    valor?: number | null;
    dataVencimento?: string | null;
    paymentUrl?: string | null;
  } | null>(null);

  const { data: clientesDisponiveis = [], isLoading: carregandoClientes } =
    useFinanceiroClientes(buscaCliente, true);
  const criarConta = useCriarContaFinanceira();

  const onSubmit = () => {
    setErro(null);
    const valorNumerico = Number(valor);
    if (
      !descricao.trim() ||
      !valor ||
      !vencimento ||
      Number.isNaN(valorNumerico) ||
      valorNumerico <= 0
    ) {
      if (valorNumerico <= 0 || Number.isNaN(valorNumerico)) {
        setErro("Informe um valor positivo.");
      } else {
        setErro("Preencha descrição, valor e vencimento.");
      }
      return;
    }
    const clienteIdNum = selectedClienteId
      ? Number(selectedClienteId)
      : undefined;
    criarConta.mutate(
      {
        tipo: "Receber",
        payload: {
          descricao: descricao.trim(),
          valor: valorNumerico,
          vencimento,
          clienteId: clienteIdNum,
          integrarAsaas: true,
          billingType: "BOLETO",
        },
      },
      {
        onSuccess: (conta) => {
          setPreviewConta({
            clienteNome: conta.cliente?.nome ?? null,
            clienteCpf: conta.cliente?.cpf ?? null,
            valor: conta.valor ?? null,
            dataVencimento: conta.dataVencimento ?? null,
            paymentUrl: conta.paymentUrl ?? null,
          });
          setDescricao("");
          setValor("");
          setVencimento("");
          setSelectedClienteId("");
        },
        onError: (error) => {
          setErro(
            error instanceof Error ? error.message : "Falha ao emitir boleto.",
          );
        },
      },
    );
  };

  const handlePreviewLocal = () => {
    if (!previewConta) return;
    const pagamento = {
      id: "preview",
      cliente: {
        id: "0",
        nome: previewConta.clienteNome ?? "Cliente",
        email: "",
        telefone: "",
        cpf: previewConta.clienteCpf ?? "",
        plano: "",
      },
      valor: Number(previewConta.valor ?? 0),
      dataVencimento: previewConta.dataVencimento ?? new Date().toISOString(),
      dataPagamento: null,
      status: "PENDENTE" as const,
      metodoPagamento: "Boleto" as const,
      referencia: "Pré-visualização",
      diasAtraso: 0,
      observacoes: "",
    };
    gerarBoletoPDF(pagamento);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Emissão de Boletos
            <AsaasWingsMark variant="badge" withTooltip />
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Descrição</label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Valor</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Vencimento</label>
            <Input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Cliente</label>
            <div className="space-y-2">
              <Input
                placeholder="Buscar por nome, e-mail ou CPF"
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
              />
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={selectedClienteId}
                onChange={(e) => setSelectedClienteId(e.target.value)}
              >
                <option value="">Selecione um cliente</option>
                {carregandoClientes && (
                  <option value="" disabled>
                    Carregando clientes...
                  </option>
                )}
                {!carregandoClientes &&
                  clientesDisponiveis.map((cliente) => (
                    <option key={cliente.id} value={String(cliente.id)}>
                      {cliente.nome} • {cliente.cpf || "CPF não informado"}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-4">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setDescricao("");
              setValor("");
              setVencimento("");
              setSelectedClienteId("");
              setErro(null);
              setPreviewConta(null);
            }}
          >
            Limpar
          </Button>
          <Button onClick={onSubmit} disabled={criarConta.isPending}>
            {criarConta.isPending ? "Emitindo..." : "Emitir Boleto"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="font-semibold text-gray-900 mb-3">Pré-visualização</h4>
        {!previewConta ? (
          <p className="text-sm text-gray-500">
            Nenhum boleto emitido ainda. Após emitir, você poderá visualizar
            aqui.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AsaasWingsMark variant="inline" withTooltip />
              <span className="text-sm text-gray-700">
                {previewConta.clienteNome ?? "Cliente"} •{" "}
                {previewConta.dataVencimento
                  ? new Date(previewConta.dataVencimento).toLocaleDateString(
                      "pt-BR",
                    )
                  : "—"}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              Valor: R$ {(previewConta.valor ?? 0).toLocaleString("pt-BR")}
            </div>
            <div className="flex items-center gap-3">
              {previewConta.paymentUrl ? (
                <a
                  href={previewConta.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Abrir boleto no provedor
                </a>
              ) : (
                <span className="text-xs text-gray-500">
                  Link do provedor ainda não disponível.
                </span>
              )}
              <Button variant="outline" onClick={handlePreviewLocal}>
                Pré-visualizar PDF local
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
