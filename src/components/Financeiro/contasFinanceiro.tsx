"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  Pencil,
  Trash,
  PlusCircle,
  Copy,
  Link,
  RefreshCcw,
  AlertCircle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  FileSpreadsheet,
  Table,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContaFinanceira,
  StatusFinanceiro,
  TipoConta,
  getDiasAtraso,
} from "@/types/Financeiro";
import { useContasFinanceiras } from "@/hooks/queries/useContasFinanceiras";
import {
  useBaixarContaFinanceira,
  useEstornarContaFinanceira,
  useCriarContaFinanceira,
  useAtualizarContaFinanceira,
  useDeletarContaFinanceira,
  useReconsultarContaReceber,
} from "@/hooks/mutations/useContaFinanceiraMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinanceiroClientes } from "@/hooks/queries/useFinanceiroClientes";
import type { ClienteFinanceiroResumo } from "@/services/financeiro/clientes.service";
import { toast } from "sonner";
import AsaasWingsMark from "@/components/ui/AsaasWingsMark";

type FiltroStatus =
  | "todas"
  | "pagas"
  | "pendentes"
  | "atrasadas"
  | "canceladas";

const statusConfig: Record<
  StatusFinanceiro,
  { icon: React.ElementType; color: string; bg: string }
> = {
  PENDENTE: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  ATRASADO: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  VENCIDO: { icon: AlertCircle, color: "text-red-700", bg: "bg-red-50" },
  PAGO: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  RECEBIDO: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  CANCELADO: { icon: AlertTriangle, color: "text-gray-600", bg: "bg-gray-100" },
};

const ContasFinanceiro: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useContasFinanceiras();
  const contas = useMemo(() => data ?? [], [data]);
  const baixarConta = useBaixarContaFinanceira();
  const estornarConta = useEstornarContaFinanceira();
  const criarConta = useCriarContaFinanceira();
  const reconsultarConta = useReconsultarContaReceber();
  const atualizarConta = useAtualizarContaFinanceira();
  const deletarConta = useDeletarContaFinanceira();

  const [termoBusca, setTermoBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
  const [ordenacao, setOrdenacao] = useState<{
    campo: keyof ContaFinanceira | "status";
    direcao: "asc" | "desc";
  }>({
    campo: "dataVencimento",
    direcao: "asc",
  });

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");
  const [filtroTipo, setFiltroTipo] = useState<TipoConta | "todas">("todas");
  const [mostrarModalNovaConta, setMostrarModalNovaConta] = useState(false);
  const [tipoContaNova, setTipoContaNova] = useState<TipoConta>("Pagar");
  const [modoModalConta, setModoModalConta] = useState<"criar" | "editar">(
    "criar",
  );
  const [contaEditandoId, setContaEditandoId] = useState<number | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [erroNovaConta, setErroNovaConta] = useState<string | null>(null);
  const [formNovaConta, setFormNovaConta] = useState({
    descricao: "",
    valor: "",
    vencimento: "",
    fornecedor: "",
    clienteId: "",
    clienteNome: "",
  });
  const [acaoAsaasConfirmacao, setAcaoAsaasConfirmacao] = useState<{
    conta: ContaFinanceira;
    tipo: "baixa" | "estorno";
  } | null>(null);
  const [cooldownReconsulta, setCooldownReconsulta] = useState<
    Record<string, number>
  >({});
  const COOLDOWN_RECONSULTA_MS = 4000;

  const { data: clientesDisponiveis = [], isLoading: carregandoClientes } =
    useFinanceiroClientes(
      buscaCliente,
      mostrarModalNovaConta && tipoContaNova === "Receber",
    );

  const resumo = useMemo(() => {
    const totalPagar = contas
      .filter((c) => c.tipo === "Pagar")
      .reduce((acc, c) => acc + c.valor, 0);
    const totalReceber = contas
      .filter((c) => c.tipo === "Receber")
      .reduce((acc, c) => acc + c.valor, 0);

    return {
      pagar: totalPagar,
      receber: totalReceber,
      saldo: totalReceber - totalPagar,
    };
  }, [contas]);

  const contasFiltradas = useMemo(() => {
    const resultado = contas.filter((conta) => {
      // Filtro de Tipo
      const matchTipo =
        filtroTipo === "todas" ? true : conta.tipo === filtroTipo;
      if (!matchTipo) return false;

      // Filtro de Status
      let matchStatus = true;
      switch (filtroStatus) {
        case "pagas":
          matchStatus = conta.status === "PAGO" || conta.status === "RECEBIDO";
          break;
        case "pendentes":
          matchStatus = conta.status === "PENDENTE";
          break;
        case "atrasadas":
          matchStatus =
            conta.status === "ATRASADO" || conta.status === "VENCIDO";
          break;
        case "canceladas":
          matchStatus = conta.status === "CANCELADO";
          break;
        default:
          matchStatus = true;
      }
      if (!matchStatus) return false;

      // Busca Textual
      if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        const matchDescricao = conta.descricao.toLowerCase().includes(termo);
        const matchParceiro = conta.parceiro?.toLowerCase().includes(termo);
        const matchValor = conta.valor.toString().includes(termo);
        if (!matchDescricao && !matchParceiro && !matchValor) return false;
      }

      return true;
    });

    // Ordenação
    resultado.sort((a, b) => {
      const aValue = a[ordenacao.campo];
      const bValue = b[ordenacao.campo];

      if (aValue === bValue) return 0;

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      const comparison = aValue > bValue ? 1 : -1;
      return ordenacao.direcao === "asc" ? comparison : -comparison;
    });

    return resultado;
  }, [contas, filtroStatus, filtroTipo, termoBusca, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(contasFiltradas.length / itensPorPagina);
  const contasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return contasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [contasFiltradas, paginaAtual, itensPorPagina]);

  const handleOrdenacao = (campo: keyof ContaFinanceira | "status") => {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const exportarCSV = () => {
    const headers = [
      "Tipo",
      "Descrição",
      "Parceiro",
      "Vencimento",
      "Valor",
      "Status",
    ];
    const rows = contasFiltradas.map((c) => [
      c.tipo,
      c.descricao,
      c.parceiro || "",
      new Date(c.dataVencimento).toLocaleDateString("pt-BR"),
      c.valor.toFixed(2),
      c.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_financeiro.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório Financeiro - PlanVita", 14, 20);

    const tableColumn = [
      "Tipo",
      "Descrição",
      "Parceiro",
      "Vencimento",
      "Valor",
      "Status",
    ];
    const tableRows = contasFiltradas.map((c) => [
      c.tipo,
      c.descricao,
      c.parceiro || "",
      new Date(c.dataVencimento).toLocaleDateString("pt-BR"),
      `R$ ${c.valor.toFixed(2)}`,
      c.status,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save("relatorio_financeiro.pdf");
  };

  const exportarExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      contasFiltradas.map((c) => ({
        Tipo: c.tipo,
        Descrição: c.descricao,
        Parceiro: c.parceiro,
        Vencimento: new Date(c.dataVencimento).toLocaleDateString("pt-BR"),
        Valor: c.valor,
        Status: c.status,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");
    XLSX.writeFile(workbook, "relatorio_financeiro.xlsx");
  };

  const podeBaixar = (conta: ContaFinanceira) =>
    conta.status === "PENDENTE" ||
    conta.status === "ATRASADO" ||
    conta.status === "VENCIDO";

  const podeEstornar = (conta: ContaFinanceira) =>
    conta.status === "PAGO" || conta.status === "RECEBIDO";

  const executarBaixa = (conta: ContaFinanceira) => {
    baixarConta.mutate({
      tipo: conta.tipo,
      id: conta.id,
    });
  };

  const executarEstorno = (conta: ContaFinanceira) => {
    estornarConta.mutate({
      tipo: conta.tipo,
      id: conta.id,
    });
  };

  const handleBaixa = (conta: ContaFinanceira) => {
    if (conta.asaasPaymentId && conta.tipo === "Receber") {
      setAcaoAsaasConfirmacao({ conta, tipo: "baixa" });
      return;
    }
    executarBaixa(conta);
  };

  const handleEstorno = (conta: ContaFinanceira) => {
    if (conta.asaasPaymentId && conta.tipo === "Receber") {
      setAcaoAsaasConfirmacao({ conta, tipo: "estorno" });
      return;
    }
    executarEstorno(conta);
  };

  const resetModal = () => {
    setMostrarModalNovaConta(false);
    setErroNovaConta(null);
    setBuscaCliente("");
    setModoModalConta("criar");
    setContaEditandoId(null);
    setFormNovaConta({
      descricao: "",
      valor: "",
      vencimento: "",
      fornecedor: "",
      clienteId: "",
      clienteNome: "",
    });
  };

  const handleCriarConta = () => {
    setErroNovaConta(null);
    const valorNumerico = Number(formNovaConta.valor);
    if (
      !formNovaConta.descricao.trim() ||
      !formNovaConta.valor ||
      !formNovaConta.vencimento ||
      Number.isNaN(valorNumerico) ||
      valorNumerico <= 0
    ) {
      if (valorNumerico <= 0 || Number.isNaN(valorNumerico)) {
        setErroNovaConta("Informe um valor positivo.");
      }
      return;
    }

    if (tipoContaNova === "Pagar") {
      criarConta.mutate(
        {
          tipo: "Pagar",
          payload: {
            descricao: formNovaConta.descricao.trim(),
            valor: valorNumerico,
            vencimento: formNovaConta.vencimento,
            fornecedor: formNovaConta.fornecedor.trim() || undefined,
          },
        },
        {
          onSuccess: resetModal,
        },
      );
    } else {
      const clienteId = formNovaConta.clienteId
        ? Number(formNovaConta.clienteId)
        : undefined;

      if (!clienteId) {
        setErroNovaConta("Selecione um cliente vinculado à conta.");
        return;
      }

      criarConta.mutate(
        {
          tipo: "Receber",
          payload: {
            descricao: formNovaConta.descricao.trim(),
            valor: valorNumerico,
            vencimento: formNovaConta.vencimento,
            clienteId,
          },
        },
        {
          onSuccess: resetModal,
        },
      );
    }
  };

  const handleAbrirEdicao = (conta: ContaFinanceira) => {
    setErroNovaConta(null);
    setBuscaCliente("");
    setModoModalConta("editar");
    setMostrarModalNovaConta(true);
    setTipoContaNova(conta.tipo);
    setContaEditandoId(conta.id);
    const venc = new Date(conta.dataVencimento).toISOString().slice(0, 10);
    setFormNovaConta({
      descricao: conta.descricao || "",
      valor: conta.valor.toString(),
      vencimento: venc,
      fornecedor: conta.tipo === "Pagar" ? conta.parceiro || "" : "",
      clienteId:
        conta.tipo === "Receber" ? conta.clienteId?.toString() || "" : "",
      clienteNome: conta.tipo === "Receber" ? conta.cliente?.nome || "" : "",
    });
  };

  const handleAtualizarConta = () => {
    setErroNovaConta(null);
    const valorNumerico = Number(formNovaConta.valor);
    if (
      !formNovaConta.descricao.trim() ||
      !formNovaConta.valor ||
      !formNovaConta.vencimento ||
      Number.isNaN(valorNumerico) ||
      valorNumerico <= 0
    ) {
      if (valorNumerico <= 0 || Number.isNaN(valorNumerico)) {
        setErroNovaConta("Informe um valor positivo.");
      }
      return;
    }

    if (!contaEditandoId) return;

    if (tipoContaNova === "Pagar") {
      atualizarConta.mutate(
        {
          tipo: "Pagar",
          id: contaEditandoId,
          payload: {
            descricao: formNovaConta.descricao.trim(),
            valor: valorNumerico,
            vencimento: formNovaConta.vencimento,
            fornecedor: formNovaConta.fornecedor.trim() || undefined,
          },
        },
        {
          onSuccess: resetModal,
        },
      );
    } else {
      const clienteId = formNovaConta.clienteId
        ? Number(formNovaConta.clienteId)
        : undefined;

      if (!clienteId) {
        setErroNovaConta("Selecione um cliente vinculado à conta.");
        return;
      }

      atualizarConta.mutate(
        {
          tipo: "Receber",
          id: contaEditandoId,
          payload: {
            descricao: formNovaConta.descricao.trim(),
            valor: valorNumerico,
            vencimento: formNovaConta.vencimento,
            clienteId,
          },
        },
        {
          onSuccess: resetModal,
        },
      );
    }
  };

  const handleExcluirConta = (conta: ContaFinanceira) => {
    deletarConta.mutate({
      tipo: conta.tipo,
      id: conta.id,
    });
  };

  const confirmarAcaoAsaas = () => {
    if (!acaoAsaasConfirmacao) return;
    const { conta, tipo } = acaoAsaasConfirmacao;
    if (tipo === "baixa") {
      executarBaixa(conta);
    } else {
      executarEstorno(conta);
    }
    setAcaoAsaasConfirmacao(null);
  };

  const cancelarConfirmacao = () => setAcaoAsaasConfirmacao(null);

  const copiarValor = (valor: string | null | undefined, label: string) => {
    if (!valor) {
      toast.error(`${label} indisponível para esta cobrança`);
      return;
    }
    navigator.clipboard
      .writeText(valor)
      .then(() =>
        toast.success(`${label} copiado para a área de transferência`),
      )
      .catch(() => toast.error("Não foi possível copiar o valor"));
  };

  const handleReconsultaStatus = (conta: ContaFinanceira) => {
    if (conta.tipo !== "Receber") return;
    const chave = conta.id.toString();
    const agora = Date.now();
    const ultimoAcionamento = cooldownReconsulta[chave] ?? 0;

    if (agora - ultimoAcionamento < COOLDOWN_RECONSULTA_MS) {
      toast.info("Aguarde alguns segundos antes de reconsultar novamente.");
      return;
    }

    if (!conta.asaasPaymentId && !conta.asaasSubscriptionId) {
      toast.error("Conta ainda não sincronizada com o Asaas.");
      return;
    }

    reconsultarConta.mutate(conta.id, {
      onSuccess: () => {
        setCooldownReconsulta((prev) => ({
          ...prev,
          [chave]: agora,
        }));
      },
    });
  };

  const isReconsultando = (conta: ContaFinanceira) =>
    reconsultarConta.isPending &&
    reconsultarConta.variables?.toString() === conta.id.toString();

  const isProcessing = (conta: ContaFinanceira) => {
    const targetId = conta.id.toString();
    if (
      baixarConta.isPending &&
      baixarConta.variables &&
      baixarConta.variables.id.toString() === targetId
    ) {
      return true;
    }

    if (
      estornarConta.isPending &&
      estornarConta.variables &&
      estornarConta.variables.id.toString() === targetId
    ) {
      return true;
    }

    if (
      atualizarConta.isPending &&
      atualizarConta.variables &&
      atualizarConta.variables.id.toString() === targetId
    ) {
      return true;
    }

    if (
      deletarConta.isPending &&
      deletarConta.variables &&
      deletarConta.variables.id.toString() === targetId
    ) {
      return true;
    }

    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Carregando informações financeiras...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold mb-2">
          Não foi possível carregar as contas financeiras.
        </p>
        {error instanceof Error && (
          <p className="text-sm text-red-600 mb-4">{error.message}</p>
        )}
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 rounded-2xl border border-gray-200">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" />
            Contas Financeiras
          </h2>

          <div className="flex flex-wrap justify-end gap-2">
            {(
              [
                "todas",
                "pagas",
                "pendentes",
                "atrasadas",
                "canceladas",
              ] as const
            ).map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                  filtroStatus === status
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
            <Button
              onClick={() => {
                setErroNovaConta(null);
                setBuscaCliente("");
                setModoModalConta("criar");
                setMostrarModalNovaConta(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Nova conta
            </Button>
          </div>
        </div>

        {/* Busca e Exportação */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por descrição, parceiro ou valor..."
              value={termoBusca}
              onChange={(e) => {
                setTermoBusca(e.target.value);
                setPaginaAtual(1);
              }}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Exportar
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportarCSV}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportarExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportarPDF}>
                <Table className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Contas a pagar</p>
                <p className="text-xl font-semibold text-gray-900">
                  R$ {resumo.pagar.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Contas a receber</p>
                <p className="text-xl font-semibold text-gray-900">
                  R$ {resumo.receber.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo projetado</p>
                <p
                  className={`text-xl font-semibold ${
                    resumo.saldo >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  R$ {resumo.saldo.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro tipo */}
        <div className="flex flex-wrap gap-3">
          {(["todas", "Pagar", "Receber"] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() =>
                setFiltroTipo(tipo === "todas" ? "todas" : (tipo as TipoConta))
              }
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                filtroTipo === tipo
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
              }`}
            >
              {tipo === "todas" ? "Todas as contas" : `Contas a ${tipo}`}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {(
                    [
                      { label: "Tipo", key: "tipo" },
                      { label: "Descrição", key: "descricao" },
                      { label: "Parceiro", key: "parceiro" },
                      { label: "Vencimento", key: "dataVencimento" },
                      { label: "Valor", key: "valor" },
                      { label: "Status", key: "status" },
                    ] as {
                      label: string;
                      key: keyof ContaFinanceira | "status";
                    }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => handleOrdenacao(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {ordenacao.campo === col.key &&
                          (ordenacao.direcao === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Cobrança Asaas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {contasFiltradas.map((conta) => {
                  const meta =
                    statusConfig[conta.status] ?? statusConfig.PENDENTE;
                  const Icon = meta.icon;
                  const diasAtraso = getDiasAtraso(conta);
                  const atrasada =
                    diasAtraso > 0 &&
                    (conta.status === "PENDENTE" ||
                      conta.status === "ATRASADO" ||
                      conta.status === "VENCIDO");
                  const chave = conta.id.toString();
                  const sincronizada =
                    !!conta.asaasPaymentId || !!conta.asaasSubscriptionId;
                  const cooldownAtivo =
                    (cooldownReconsulta[chave] ?? 0) + COOLDOWN_RECONSULTA_MS >
                    Date.now();
                  const staleAsaas =
                    sincronizada &&
                    (conta.status === "PENDENTE" ||
                      conta.status === "VENCIDO") &&
                    diasAtraso > 0;
                  const metodoPagamento =
                    conta.metodoPagamento?.toUpperCase() ||
                    (sincronizada ? "ASAAS" : "—");

                  return (
                    <tr
                      key={`${conta.tipo}-${conta.id}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {conta.tipo === "Pagar" ? (
                          <span className="text-red-600">Pagar</span>
                        ) : (
                          <span className="text-green-600">Receber</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="font-semibold flex items-center gap-2">
                          {conta.descricao}
                          {sincronizada && (
                            <AsaasWingsMark variant="badge" withTooltip />
                          )}
                        </p>
                        {conta.observacao && (
                          <p className="text-xs text-gray-500">
                            {conta.observacao}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p className="font-medium">{conta.parceiro}</p>
                        {conta.contato && (
                          <p className="text-xs text-gray-500">
                            {conta.contato}
                          </p>
                        )}
                        {conta.cliente?.cpf && (
                          <p className="text-xs text-gray-500">
                            CPF: {conta.cliente.cpf}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p className="font-medium">
                          {new Date(conta.dataVencimento).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                        {atrasada && (
                          <p className="text-xs text-red-600 font-medium">
                            {diasAtraso} dias em atraso
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        R$ {conta.valor.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}
                        >
                          <Icon className="w-4 h-4" />
                          {conta.status}
                          {sincronizada && (
                            <AsaasWingsMark
                              className="w-3.5 h-3.5 text-sky-500"
                              variant="default"
                              withTooltip={false}
                            />
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {conta.tipo === "Receber" && sincronizada ? (
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                              <Link className="w-4 h-4" />
                              Sincronizado Asaas
                            </span>
                            <p className="text-xs text-gray-600">
                              Método:{" "}
                              <span className="font-semibold text-gray-800">
                                {metodoPagamento}
                              </span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  copiarValor(
                                    conta.paymentUrl,
                                    "Link de pagamento",
                                  )
                                }
                                className="px-3 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copiar link
                              </button>
                              <button
                                onClick={() =>
                                  copiarValor(conta.pixQrCode, "PIX")
                                }
                                disabled={!conta.pixQrCode}
                                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                                  conta.pixQrCode
                                    ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                    : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                <Copy className="w-3 h-3" />
                                Copiar PIX
                              </button>
                              <button
                                onClick={() => handleReconsultaStatus(conta)}
                                disabled={
                                  isReconsultando(conta) || cooldownAtivo
                                }
                                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                                  isReconsultando(conta) || cooldownAtivo
                                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                {isReconsultando(conta) ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCcw className="w-3 h-3" />
                                )}
                                Atualizar status
                              </button>
                            </div>
                            {staleAsaas && (
                              <p className="text-[11px] text-amber-700 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Status pode estar desatualizado; use a
                                reconsulta.
                              </p>
                            )}
                            {!conta.paymentUrl && !conta.pixQrCode && (
                              <p className="text-[11px] text-gray-500">
                                Links/PIX ainda não retornaram do Asaas.
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            {conta.tipo === "Receber" ? "Cobrança manual" : "—"}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {podeBaixar(conta) && (
                            <button
                              onClick={() => handleBaixa(conta)}
                              disabled={isProcessing(conta)}
                              className="px-3 py-1 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {isProcessing(conta) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Baixar
                            </button>
                          )}

                          {podeEstornar(conta) && (
                            <button
                              onClick={() => handleEstorno(conta)}
                              disabled={isProcessing(conta)}
                              className="px-3 py-1 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {isProcessing(conta) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              Estornar
                            </button>
                          )}

                          <button
                            onClick={() => handleAbrirEdicao(conta)}
                            disabled={isProcessing(conta)}
                            className="px-3 py-1 rounded-md text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isProcessing(conta) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Pencil className="w-3 h-3" />
                            )}
                            Editar
                          </button>

                          <button
                            onClick={() => handleExcluirConta(conta)}
                            disabled={isProcessing(conta)}
                            className="px-3 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isProcessing(conta) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash className="w-3 h-3" />
                            )}
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {contasFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      Nenhuma conta encontrada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between p-4 bg-white border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Mostrando {contasPaginadas.length} de {contasFiltradas.length}{" "}
              resultados
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {paginaAtual} de {totalPaginas || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={paginaAtual >= totalPaginas}
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {acaoAsaasConfirmacao && (
        <ModalConfirmacaoAsaas
          conta={acaoAsaasConfirmacao.conta}
          acao={acaoAsaasConfirmacao.tipo}
          onCancel={cancelarConfirmacao}
          onConfirm={confirmarAcaoAsaas}
          isProcessing={isProcessing(acaoAsaasConfirmacao.conta)}
        />
      )}
      {mostrarModalNovaConta && (
        <ModalNovaConta
          titulo={
            modoModalConta === "criar"
              ? "Nova conta financeira"
              : "Editar conta financeira"
          }
          tipo={tipoContaNova}
          setTipo={setTipoContaNova}
          form={formNovaConta}
          setForm={setFormNovaConta}
          onClose={resetModal}
          onSubmit={
            modoModalConta === "criar" ? handleCriarConta : handleAtualizarConta
          }
          isSubmitting={
            modoModalConta === "criar"
              ? criarConta.isPending
              : atualizarConta.isPending
          }
          clientes={clientesDisponiveis}
          isLoadingClientes={carregandoClientes}
          buscaCliente={buscaCliente}
          onChangeBuscaCliente={setBuscaCliente}
          erro={erroNovaConta}
          onClearErro={() => setErroNovaConta(null)}
        />
      )}
    </div>
  );
};

const ModalConfirmacaoAsaas = ({
  conta,
  acao,
  onConfirm,
  onCancel,
  isProcessing,
}: {
  conta: ContaFinanceira;
  acao: "baixa" | "estorno";
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}) => {
  const titulo =
    acao === "baixa" ? "Confirmar baixa manual" : "Confirmar estorno manual";
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4 border border-emerald-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <span>
              Esta conta está sincronizada com o Asaas. Registrar a ação manual
              aqui não altera o status no provedor. Prefira usar reconsulta
              antes de confirmar.
            </span>
          </p>
          {conta.asaasPaymentId && (
            <p className="text-xs text-gray-500">
              asaasPaymentId: <strong>{conta.asaasPaymentId}</strong>
            </p>
          )}
          {conta.paymentUrl && (
            <p className="text-xs text-gray-500 break-all">
              Link atual: {conta.paymentUrl}
            </p>
          )}
          {conta.pixQrCode && (
            <p className="text-xs text-gray-500">
              PIX disponível — considere copiar e enviar ao cliente.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirmar mesmo assim"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ModalNovaConta = ({
  titulo,
  tipo,
  setTipo,
  form,
  setForm,
  onClose,
  onSubmit,
  isSubmitting,
  clientes,
  isLoadingClientes,
  buscaCliente,
  onChangeBuscaCliente,
  erro,
  onClearErro,
}: {
  titulo: string;
  tipo: TipoConta;
  setTipo: (tipo: TipoConta) => void;
  form: {
    descricao: string;
    valor: string;
    vencimento: string;
    fornecedor: string;
    clienteId: string;
    clienteNome: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      descricao: string;
      valor: string;
      vencimento: string;
      fornecedor: string;
      clienteId: string;
      clienteNome: string;
    }>
  >;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  clientes: ClienteFinanceiroResumo[];
  isLoadingClientes: boolean;
  buscaCliente: string;
  onChangeBuscaCliente: (valor: string) => void;
  erro: string | null;
  onClearErro: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Tipo</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              value={tipo}
              onChange={(event) => {
                const novoTipo = event.target.value as TipoConta;
                setTipo(novoTipo);
                onClearErro();
                setForm((prev) => ({
                  ...prev,
                  ...(novoTipo === "Pagar"
                    ? { clienteId: "", clienteNome: "" }
                    : { fornecedor: "" }),
                }));
              }}
            >
              <option value="Pagar">Conta a pagar</option>
              <option value="Receber">Conta a receber</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Descrição</label>
            <Input
              value={form.descricao}
              onChange={(event) => {
                onClearErro();
                setForm((prev) => ({ ...prev, descricao: event.target.value }));
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Valor</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(event) => {
                  onClearErro();
                  setForm((prev) => ({ ...prev, valor: event.target.value }));
                }}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Vencimento</label>
              <Input
                type="date"
                value={form.vencimento}
                onChange={(event) => {
                  onClearErro();
                  setForm((prev) => ({
                    ...prev,
                    vencimento: event.target.value,
                  }));
                }}
              />
            </div>
          </div>

          {tipo === "Pagar" ? (
            <div>
              <label className="text-sm text-gray-600">
                Fornecedor (opcional)
              </label>
              <Input
                value={form.fornecedor}
                onChange={(event) => {
                  onClearErro();
                  setForm((prev) => ({
                    ...prev,
                    fornecedor: event.target.value,
                  }));
                }}
                placeholder="Fornecedor responsável pelo pagamento"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600">
                  Cliente vinculado
                </label>
                <Input
                  value={buscaCliente}
                  onChange={(event) => {
                    onChangeBuscaCliente(event.target.value);
                    onClearErro();
                  }}
                  placeholder="Buscar por nome, e-mail ou CPF"
                />
              </div>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.clienteId}
                onChange={(event) => {
                  const selectedValue = event.target.value;
                  const cliente = clientes.find(
                    (item) => String(item.id) === selectedValue,
                  );
                  onClearErro();
                  setForm((prev) => ({
                    ...prev,
                    clienteId: selectedValue,
                    clienteNome: cliente?.nome ?? prev.clienteNome,
                  }));
                }}
              >
                <option value="">Selecione um cliente</option>
                {isLoadingClientes && (
                  <option value="" disabled>
                    Carregando clientes...
                  </option>
                )}
                {!isLoadingClientes &&
                  clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} • {cliente.cpf || "CPF não informado"}
                    </option>
                  ))}
              </select>
              {form.clienteNome && (
                <p className="text-xs text-gray-500">
                  Cliente selecionado: {form.clienteNome}
                </p>
              )}
            </div>
          )}
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContasFinanceiro;
