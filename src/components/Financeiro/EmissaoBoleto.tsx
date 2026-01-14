"use client";

import React, { useState, useMemo } from "react";
import { useFinanceiroClientes } from "@/hooks/queries/useFinanceiroClientes";
import { useCriarContaFinanceira } from "@/hooks/mutations/useContaFinanceiraMutations";
import { useContasFinanceiras } from "@/hooks/queries/useContasFinanceiras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Barcode,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { AsaasWingsMark } from "@/components/ui/AsaasWingsMark";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// Simple inline currency formatter to avoid missing module
const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
};

/**
 * Componente responsável pela emissão de boletos integrados ao Asaas via API.
 *
 * Funcionalidades:
 * - Seleção de cliente (com busca)
 * - Definição de valor e data de vencimento
 * - Configurações adicionais (multa, juros, notificacoes)
 * - Visualização prévia do boleto (mock visual para conferência)
 * - Integração com mutation `useCriarContaFinanceira` enviando `integrarAsaas: true` e `billingType: "BOLETO"`
 * - Histórico de boletos emitidos com filtros e paginação
 *
 * O componente valida os campos obrigatórios antes de permitir a emissão.
 *
 * @returns {JSX.Element} O formulário de emissão de boleto, a prévia opcional e o histórico.
 */
export default function EmissaoBoleto() {
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({
    multa: true,
    juros: true,
    notificacoes: true,
  });

  // Estados para o histórico
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const { data: clientes = [], isLoading: carregandoClientes } =
    useFinanceiroClientes(buscaCliente, true);

  const { data: todasContas = [], isLoading: carregandoContas } =
    useContasFinanceiras();

  const criarConta = useCriarContaFinanceira();

  const clienteObj = useMemo(() => {
    return clientes.find((c) => c.id.toString() === clienteSelecionado);
  }, [clientes, clienteSelecionado]);

  const valorNumerico = useMemo(() => {
    if (!valor) return 0;
    return parseFloat(valor.replace(/[^0-9,.]/g, "").replace(",", "."));
  }, [valor]);

  // Filtrar boletos emitidos
  const boletosEmitidos = useMemo(() => {
    return todasContas
      .filter((conta) => {
        // Verifica se é uma conta a receber e se tem integração com Asaas (provavelmente boleto)
        // Idealmente filtraríamos por metodoPagamento === "BOLETO", mas vamos garantir pegando integrações Asaas
        const isReceber = conta.tipo === "Receber";
        const isAsaas = !!conta.asaasPaymentId;
        const isBoleto = conta.metodoPagamento === "BOLETO" || isAsaas; // Assumindo Asaas como principal fonte de boletos aqui

        if (!isReceber || !isBoleto) return false;

        // Filtro de data
        if (filtroDataInicio) {
          const dataConta = new Date(conta.dataVencimento);
          const inicio = new Date(filtroDataInicio);
          // Ajuste para comparar apenas a data, ignorando hora
          if (
            dataConta.toISOString().split("T")[0] <
            inicio.toISOString().split("T")[0]
          )
            return false;
        }

        if (filtroDataFim) {
          const dataConta = new Date(conta.dataVencimento);
          const fim = new Date(filtroDataFim);
          if (
            dataConta.toISOString().split("T")[0] >
            fim.toISOString().split("T")[0]
          )
            return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.dataVencimento).getTime() -
          new Date(a.dataVencimento).getTime(),
      ); // Mais recentes primeiro
  }, [todasContas, filtroDataInicio, filtroDataFim]);

  // Paginação
  const totalPaginas = Math.ceil(boletosEmitidos.length / itensPorPagina);
  const boletosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return boletosEmitidos.slice(inicio, inicio + itensPorPagina);
  }, [boletosEmitidos, paginaAtual]);

  const handleEmissao = () => {
    if (!clienteSelecionado || !valorNumerico || !vencimento || !descricao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    criarConta.mutate(
      {
        tipo: "Receber",
        payload: {
          clienteId: Number(clienteSelecionado),
          valor: valorNumerico,
          vencimento,
          descricao,
          integrarAsaas: true,
          billingType: "BOLETO",
        },
      },
      {
        onSuccess: () => {
          setValor("");
          setVencimento("");
          setDescricao("");
          setClienteSelecionado("");
          setPreviewMode(false);
          toast.success(
            "Boleto emitido com sucesso! Sincronização com Asaas iniciada.",
          );
        },
      },
    );
  };

  const hoje = new Date().toISOString().split("T")[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAGO":
      case "RECEBIDO":
        return "bg-green-100 text-green-700 border-green-200";
      case "PENDENTE":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "VENCIDO":
      case "ATRASADO":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna da Esquerda: Formulário */}
        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-gray-500" />
                Emissão de Boleto
              </CardTitle>
              <CardDescription>
                Preencha os dados para gerar um novo boleto bancário via Asaas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    className="pl-9 mb-2"
                  />
                </div>
                <Select
                  value={clienteSelecionado}
                  onValueChange={setClienteSelecionado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {carregandoClientes ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Carregando...
                      </div>
                    ) : clientes.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Nenhum cliente encontrado
                      </div>
                    ) : (
                      clientes.map((cliente) => (
                        <SelectItem
                          key={cliente.id}
                          value={cliente.id.toString()}
                        >
                          {cliente.nome} {cliente.cpf ? `(${cliente.cpf})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="valor"
                      type="number"
                      placeholder="0,00"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className="pl-9"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vencimento">Vencimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="vencimento"
                      type="date"
                      value={vencimento}
                      onChange={(e) => setVencimento(e.target.value)}
                      className="pl-9"
                      min={hoje}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="descricao"
                    placeholder="Ex: Mensalidade Referente a..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  O boleto será registrado automaticamente no Asaas. Taxas podem
                  ser aplicadas conforme seu plano. O cliente receberá
                  notificação por e-mail se cadastrado.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Configurações Adicionais
                </h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="multa" className="cursor-pointer">
                      Aplicar multa de 2% após vencimento
                    </Label>
                    <Switch
                      id="multa"
                      checked={configuracoes.multa}
                      onCheckedChange={(c) =>
                        setConfiguracoes({ ...configuracoes, multa: c })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="juros" className="cursor-pointer">
                      Cobrar juros de 1% ao mês
                    </Label>
                    <Switch
                      id="juros"
                      checked={configuracoes.juros}
                      onCheckedChange={(c) =>
                        setConfiguracoes({ ...configuracoes, juros: c })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notificacoes" className="cursor-pointer">
                      Enviar notificações automáticas
                    </Label>
                    <Switch
                      id="notificacoes"
                      checked={configuracoes.notificacoes}
                      onCheckedChange={(c) =>
                        setConfiguracoes({ ...configuracoes, notificacoes: c })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t p-6">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                disabled={!clienteSelecionado || !valor || !vencimento}
              >
                {previewMode ? "Ocultar Prévia" : "Visualizar Prévia"}
              </Button>
              <Button
                onClick={handleEmissao}
                disabled={
                  !clienteSelecionado ||
                  !valor ||
                  !vencimento ||
                  criarConta.isPending
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {criarConta.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Emitindo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Emitir Boleto
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Coluna da Direita: Prévia e Histórico */}
        <div className="space-y-6">
          {/* Prévia do Boleto */}
          {previewMode && (
            <Card className="border-gray-200 shadow-lg bg-gray-50 border-t-4 border-t-indigo-500">
              <CardHeader className="border-b border-gray-100 bg-white pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-gray-900">
                      Prévia do Boleto
                    </CardTitle>
                    <CardDescription>
                      Visualização simulada do documento
                    </CardDescription>
                  </div>
                  <AsaasWingsMark variant="badge" />
                </div>
              </CardHeader>
              <CardContent className="bg-white p-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-dashed border-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                      <Barcode className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-bold text-lg text-gray-800">
                      PlanVita Bank
                    </span>
                  </div>
                  <span className="font-mono text-gray-500 text-sm">
                    000-0 | 00000.00000 00000.00000 ...
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Pagador
                    </p>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {clienteObj?.nome || "Nome do Cliente"}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 pl-6">
                      CPF: {clienteObj?.cpf || "000.000.000-00"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Vencimento
                    </p>
                    <p className="font-bold text-gray-900 text-lg">
                      {vencimento
                        ? new Date(vencimento).toLocaleDateString("pt-BR")
                        : "--/--/----"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Descrição
                    </p>
                    <p className="text-gray-900">
                      {descricao || "Descrição do serviço"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Valor do Documento
                    </p>
                    <p className="font-bold text-gray-900 text-2xl">
                      {valorNumerico
                        ? formatCurrency(valorNumerico)
                        : "R$ 0,00"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    Este é apenas uma prévia visual. O boleto real será gerado
                    pelo Asaas e enviado ao cliente.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Boletos */}
          <Card className="border-gray-200 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  Histórico de Boletos
                </CardTitle>
                <Badge variant="outline" className="bg-gray-50">
                  {boletosEmitidos.length} emitidos
                </Badge>
              </div>
              <CardDescription>
                Últimos boletos gerados e seus status
              </CardDescription>

              {/* Filtros */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    placeholder="Início"
                  />
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    placeholder="Fim"
                  />
                </div>
                {(filtroDataInicio || filtroDataFim) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setFiltroDataInicio("");
                      setFiltroDataFim("");
                    }}
                  >
                    <span className="sr-only">Limpar</span>×
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              {carregandoContas ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Carregando histórico...</span>
                </div>
              ) : boletosEmitidos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
                  <FileText className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">
                    Nenhum boleto encontrado no período.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {boletosPaginados.map((boleto) => (
                    <div
                      key={boleto.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <Barcode className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium text-gray-900 truncate max-w-[150px]"
                            title={boleto.parceiro ?? undefined}
                          >
                            {boleto.parceiro}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">
                              Venc:{" "}
                              {new Date(
                                boleto.dataVencimento,
                              ).toLocaleDateString("pt-BR")}
                            </p>
                            {boleto.asaasPaymentId && (
                              <AsaasWingsMark variant="inline" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(boleto.valor)}
                        </p>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(boleto.status)}`}
                          variant="outline"
                        >
                          {boleto.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <CardFooter className="pt-2 pb-4 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-gray-500">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaAtual === totalPaginas}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
