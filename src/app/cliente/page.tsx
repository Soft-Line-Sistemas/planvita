"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  History,
  Barcode,
  Calendar as CalendarIcon,
  PenTool,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCPF } from "@/helpers/formHelpers";
import type { ClientePlano } from "@/types/ClientePlano";
import { consultarClientePorCpf } from "@/services/clienteCarteirinha.service";
import CarteirinhaAsImage from "@/components/CarteirinhaAsImage";
import { useQuery } from "@tanstack/react-query";
import { listarContasDoCliente } from "@/services/financeiro/contasCliente.service";
import {
  listarAssinaturas,
  salvarAssinatura,
  type AssinaturaDigital,
} from "@/services/assinaturas-cliente.service";
import getTenantFromHost from "@/utils/getTenantFromHost";
import SignaturePad, {
  type SignaturePadHandle,
} from "@/components/SignaturePad";
import Image from "next/image";
import { AsaasWingsMark } from "@/components/ui/AsaasWingsMark";

const normalizeCpf = (value: string) => value.replace(/\D/g, "");

const validateCPF = (cpf: string): boolean => {
  const strCPF = normalizeCpf(cpf);
  if (strCPF.length !== 11) return false;

  let soma;
  let resto;
  soma = 0;

  if (strCPF === "00000000000") return false;

  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(strCPF.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(strCPF.substring(10, 11))) return false;

  return true;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const TIPOS_ASSINATURA = [
  { id: "TITULAR_ASSINATURA_1", label: "Titular - Assinatura 1" },
  { id: "TITULAR_ASSINATURA_2", label: "Titular - Assinatura 2" },
  { id: "CORRESPONSAVEL_ASSINATURA_1", label: "Responsável financeiro - 1" },
  { id: "CORRESPONSAVEL_ASSINATURA_2", label: "Responsável financeiro - 2" },
] as const;
const CONTRATO_URL = "/docs/contrato.docx";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
const ASSINATURA_API_BASE = API_BASE_URL
  ? `${API_BASE_URL}/${API_VERSION}`
  : undefined;

export default function ConsultaClientePage() {
  const [cpf, setCpf] = useState("");
  const [cliente, setCliente] = useState<ClientePlano | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<
    "carteirinha" | "plano" | "dependentes" | "financeiro" | "assinaturas"
  >("carteirinha");
  const [assinaturaEmProgresso, setAssinaturaEmProgresso] = useState<
    string | null
  >(null);
  const [assinaturaMensagem, setAssinaturaMensagem] = useState<string | null>(
    null,
  );
  const tenantFromHost =
    typeof window !== "undefined" ? getTenantFromHost() : null;

  // Filtros Financeiro
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");

  const buildAssinaturaUrl = useCallback(
    (
      assinaturaId?: number,
      mode: "inline" | "attachment" = "inline",
    ): string | undefined => {
      if (!ASSINATURA_API_BASE || !cliente?.titularId || !assinaturaId) {
        return undefined;
      }
      const base = `${ASSINATURA_API_BASE}/titular/${cliente.titularId}/assinaturas/${assinaturaId}/arquivo`;
      const params = new URLSearchParams();
      if (mode === "inline") {
        params.set("mode", "inline");
      }
      if (tenantFromHost) {
        params.set("tenant", tenantFromHost);
      }
      return params.toString() ? `${base}?${params.toString()}` : base;
    },
    [cliente?.titularId, tenantFromHost],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const digitsOnly = normalizeCpf(cpf);
    if (!validateCPF(digitsOnly)) {
      setError("CPF inválido. Por favor, verifique os números digitados.");
      return;
    }

    setIsLoading(true);
    setCliente(null);
    setIsFlipped(false);

    try {
      const clienteEncontrado = await consultarClientePorCpf(digitsOnly);
      setCliente(clienteEncontrado);
      setAbaAtiva("carteirinha");
    } catch (fetchError) {
      console.error(fetchError);
      setError(
        "CPF não encontrado ou não cadastrado. Verifique se digitou corretamente ou entre em contato com o suporte.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCpf("");
    setCliente(null);
    setError(null);
    setIsFlipped(false);
    setAbaAtiva("carteirinha");
  };

  const {
    data: contasFinanceiras = [],
    isLoading: isLoadingFinanceiro,
    refetch: refetchFinanceiro,
  } = useQuery({
    queryKey: ["cliente-financeiro", cliente?.titularId],
    queryFn: () => listarContasDoCliente(cliente!.titularId!),
    enabled: Boolean(cliente?.titularId),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (cliente?.titularId) {
      refetchFinanceiro();
    }
  }, [cliente?.titularId, refetchFinanceiro]);

  const contasFiltradas = useMemo(() => {
    let filtradas = [...contasFinanceiras];

    // Ordenação cronológica (mais recente primeiro)
    filtradas.sort(
      (a, b) =>
        new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime(),
    );

    if (filtroStatus !== "todos") {
      filtradas = filtradas.filter(
        (conta) => conta.status.toUpperCase() === filtroStatus.toUpperCase(),
      );
    }

    if (filtroPeriodo !== "todos") {
      const hoje = new Date();
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(hoje.getDate() - 30);
      const sessentaDiasAtras = new Date();
      sessentaDiasAtras.setDate(hoje.getDate() - 60);
      const noventaDiasAtras = new Date();
      noventaDiasAtras.setDate(hoje.getDate() - 90);

      if (filtroPeriodo === "30") {
        filtradas = filtradas.filter(
          (c) => new Date(c.vencimento) >= trintaDiasAtras,
        );
      } else if (filtroPeriodo === "60") {
        filtradas = filtradas.filter(
          (c) => new Date(c.vencimento) >= sessentaDiasAtras,
        );
      } else if (filtroPeriodo === "90") {
        filtradas = filtradas.filter(
          (c) => new Date(c.vencimento) >= noventaDiasAtras,
        );
      } else if (filtroPeriodo === "ano") {
        const anoAtual = hoje.getFullYear();
        filtradas = filtradas.filter(
          (c) => new Date(c.vencimento).getFullYear() === anoAtual,
        );
      }
    }

    return filtradas;
  }, [contasFinanceiras, filtroStatus, filtroPeriodo]);

  const {
    data: assinaturas = [],
    isLoading: isLoadingAssinaturas,
    refetch: refetchAssinaturas,
  } = useQuery<AssinaturaDigital[]>({
    queryKey: ["cliente-assinaturas", cliente?.titularId],
    queryFn: () => listarAssinaturas(cliente!.titularId!),
    enabled: Boolean(cliente?.titularId),
    staleTime: 30 * 1000,
  });

  const assinaturasMap = useMemo(() => {
    return assinaturas.reduce<Record<string, AssinaturaDigital>>(
      (acc, item) => {
        acc[item.tipo] = item;
        return acc;
      },
      {},
    );
  }, [assinaturas]);

  const proximaEtapaIndex = useMemo(() => {
    for (let i = 0; i < TIPOS_ASSINATURA.length; i += 1) {
      if (!assinaturasMap[TIPOS_ASSINATURA[i].id]) {
        return i;
      }
    }
    return TIPOS_ASSINATURA.length;
  }, [assinaturasMap]);

  useEffect(() => {
    if (abaAtiva === "assinaturas" && proximaEtapaIndex === 0) {
      setAssinaturaMensagem(
        "Leia o contrato e colete a primeira assinatura do titular.",
      );
    } else {
      setAssinaturaMensagem(null);
    }
  }, [abaAtiva, proximaEtapaIndex]);

  const handleSalvarAssinatura = async (
    tipo: string,
    assinaturaBase64: string,
  ) => {
    if (!cliente?.titularId) return;
    setAssinaturaMensagem(null);
    setAssinaturaEmProgresso(tipo);
    try {
      await salvarAssinatura(cliente.titularId, { tipo, assinaturaBase64 });
      await refetchAssinaturas();
    } catch (erro) {
      setAssinaturaMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar a assinatura.",
      );
    } finally {
      setAssinaturaEmProgresso(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAGO":
      case "RECEBIDO":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Pago
          </Badge>
        );
      case "PENDENTE":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        );
      case "ATRASADO":
      case "VENCIDO":
        return (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Vencido
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-100 pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pt-16">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[#22c55e]">
            Planvita
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Área do Cliente
          </h1>
          <p className="text-base text-slate-600 md:text-lg">
            Informe o CPF do titular para acessar sua carteirinha, boletos e
            plano.
          </p>
        </header>

        {!cliente && (
          <Card className="mx-auto w-full max-w-lg shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle>Acesso Seguro</CardTitle>
              <CardDescription>
                Digite seu CPF para consultar seus dados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="cpf"
                    className="text-sm font-medium text-slate-700"
                  >
                    CPF do titular
                  </label>
                  <Input
                    id="cpf"
                    name="cpf"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(event) => setCpf(formatCPF(event.target.value))}
                    maxLength={14}
                    className={error ? "border-red-500" : ""}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Consultando...
                      </>
                    ) : (
                      "Consultar"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading && !cliente && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          </div>
        )}

        {!isLoading && cliente && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {cliente.nome.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {cliente.nome}
                  </h2>
                  <p className="text-sm text-slate-500">{cliente.cpf}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-slate-500 hover:text-slate-900"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sair / Nova Consulta
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {[
                { id: "carteirinha", label: "Carteirinha" },
                { id: "plano", label: "Meu Plano" },
                cliente?.dependentes && cliente.dependentes.length > 0
                  ? { id: "dependentes", label: "Dependentes" }
                  : null,
                { id: "financeiro", label: "Financeiro e Boletos" },
                { id: "assinaturas", label: "Assinaturas" },
              ]
                .filter(Boolean)
                .map((aba) => (
                  <button
                    key={(aba as { id: string }).id}
                    onClick={() =>
                      setAbaAtiva((aba as { id: string }).id as typeof abaAtiva)
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      abaAtiva === (aba as { id: string }).id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {(aba as { label: string }).label}
                  </button>
                ))}
            </div>

            {abaAtiva === "carteirinha" && (
              <CarteirinhaAsImage
                cliente={cliente}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            )}

            {abaAtiva === "plano" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-emerald-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700">
                      <FileText className="h-5 w-5" />
                      Detalhes do Contrato
                    </CardTitle>
                    <CardDescription>
                      Informações completas sobre seu plano atual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">
                          Plano Contratado
                        </span>
                        <p className="font-semibold text-lg">
                          {cliente.plano.nome}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">
                          Código do Contrato
                        </span>
                        <p className="font-medium">{cliente.plano.codigo}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">
                          Valor Mensal
                        </span>
                        <p className="font-medium">
                          {formatCurrency(cliente.plano.valorMensal)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Status</span>
                        <Badge
                          variant={
                            cliente.plano.status === "ativo"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            cliente.plano.status === "ativo"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : ""
                          }
                        >
                          {cliente.plano.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Vigência</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {formatDate(cliente.plano.vigencia.inicio)} até{" "}
                          {formatDate(cliente.plano.vigencia.fim)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 text-emerald-800">
                        Coberturas e Benefícios
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {cliente.plano.cobertura.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-2"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700 text-base">
                      <History className="h-5 w-5" />
                      Histórico do Plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-4 border-l-2 border-emerald-100 space-y-6">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                        <p className="text-sm font-medium">Situação Atual</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(new Date().toISOString())}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Plano {cliente.plano.status}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gray-300 ring-4 ring-white" />
                        <p className="text-sm font-medium">Contratação</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(cliente.plano.vigencia.inicio)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Início da vigência do plano {cliente.plano.nome}.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {abaAtiva === "dependentes" && (
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    Dependentes do plano
                  </CardTitle>
                  <CardDescription>
                    Veja quem está vinculado ao seu plano como dependente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cliente.dependentes && cliente.dependentes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cliente.dependentes.map((dep) => (
                        <div
                          key={dep.id}
                          className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 flex flex-col gap-1"
                        >
                          <span className="text-sm font-semibold text-slate-900">
                            {dep.nome}
                          </span>
                          {dep.tipo && (
                            <span className="text-xs uppercase tracking-wide text-emerald-700">
                              {dep.tipo}
                            </span>
                          )}
                          {dep.dataNascimento && (
                            <span className="text-xs text-slate-500">
                              Nascimento: {formatDate(dep.dataNascimento)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nenhum dependente cadastrado neste plano.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {abaAtiva === "financeiro" && (
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-emerald-700 flex items-center gap-2">
                      <Barcode className="h-5 w-5" />
                      Minhas Faturas
                    </CardTitle>
                    <CardDescription>
                      Consulte seus boletos, status de pagamento e emita 2ª via.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={filtroPeriodo}
                      onValueChange={setFiltroPeriodo}
                    >
                      <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todo o período</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="60">Últimos 60 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                        <SelectItem value="ano">Este ano</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filtroStatus}
                      onValueChange={setFiltroStatus}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingFinanceiro ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p>Buscando suas faturas...</p>
                    </div>
                  ) : contasFiltradas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Descrição</th>
                            <th className="px-4 py-2 text-left">Vencimento</th>
                            <th className="px-4 py-2 text-left">Valor</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contasFinanceiras.map((conta) => (
                            <tr key={conta.id} className="border-b">
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  {conta.descricao}
                                  {(conta.asaasPaymentId ||
                                    conta.asaasSubscriptionId) && (
                                    <AsaasWingsMark variant="inline" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                {formatDate(conta.vencimento)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(conta.valor)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(conta.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                {conta.paymentUrl ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                    onClick={() =>
                                      window.open(conta.paymentUrl!, "_blank")
                                    }
                                  >
                                    <Barcode className="h-4 w-4" />
                                    {conta.status === "PENDENTE" ||
                                    conta.status === "ATRASADO"
                                      ? "Pagar Boleto"
                                      : "Ver Recibo"}
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    Indisponível
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>
                        Nenhuma fatura encontrada para o filtro selecionado.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {abaAtiva === "assinaturas" && (
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-700">
                      Assinaturas digitais
                    </h3>
                    <p className="text-sm text-gray-500">
                      Capture as assinaturas do titular e do responsável
                      financeiro.
                    </p>
                  </div>
                  {assinaturaMensagem && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md">
                      {assinaturaMensagem}
                    </p>
                  )}
                </div>

                {!cliente.titularId ? (
                  <p className="text-sm text-gray-500">
                    Titular não identificado para vincular assinaturas.
                  </p>
                ) : isLoadingAssinaturas && assinaturas.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="size-4 animate-spin" />
                    Carregando assinaturas...
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-sm text-gray-700 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Contrato de Prestação de Serviços
                        </h4>
                        <p className="mt-1">
                          Leia o contrato antes de realizar as assinaturas.
                        </p>
                      </div>
                      <a
                        href={CONTRATO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-emerald-700 font-medium shadow-sm"
                      >
                        <Download className="size-4" />
                        Baixar Contrato
                      </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {TIPOS_ASSINATURA.map((tipo, index) => {
                        const assinaturaAtual = assinaturasMap[tipo.id];
                        const previewUrl = buildAssinaturaUrl(
                          assinaturaAtual?.id,
                          "inline",
                        );
                        const downloadUrl = buildAssinaturaUrl(
                          assinaturaAtual?.id,
                          "attachment",
                        );

                        return (
                          <AssinaturaCard
                            key={tipo.id}
                            tipoId={tipo.id}
                            titulo={tipo.label}
                            assinatura={assinaturaAtual}
                            onSalvar={handleSalvarAssinatura}
                            salvando={assinaturaEmProgresso === tipo.id}
                            previewUrl={previewUrl}
                            downloadUrl={downloadUrl}
                            estado={
                              assinaturaAtual
                                ? "concluida"
                                : index === proximaEtapaIndex
                                  ? "ativa"
                                  : "pendente"
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

type AssinaturaCardProps = {
  tipoId: string;
  titulo: string;
  assinatura?: AssinaturaDigital;
  onSalvar: (tipo: string, assinaturaBase64: string) => Promise<void>;
  salvando: boolean;
  estado: "pendente" | "ativa" | "concluida";
  previewUrl?: string;
  downloadUrl?: string;
};

function AssinaturaCard({
  tipoId,
  titulo,
  assinatura,
  onSalvar,
  salvando,
  estado,
  previewUrl,
  downloadUrl,
}: AssinaturaCardProps) {
  const [capturando, setCapturando] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);

  const iniciarCaptura = () => {
    if (estado !== "pendente" && estado !== "ativa") return;
    setCapturando(true);
  };

  const cancelarCaptura = () => {
    setCapturando(false);
  };

  const confirmarAssinatura = async () => {
    if (!padRef.current) return;
    if (!padRef.current.hasDrawing()) {
      alert("Por favor, assine antes de salvar.");
      return;
    }
    const dataUrl = padRef.current.getDataURL();
    if (!dataUrl) return;

    const base64 = dataUrl.split(",")[1];
    await onSalvar(tipoId, base64);
    setCapturando(false);
  };

  if (capturando) {
    return (
      <Card className="border-emerald-200 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-emerald-800">
            Coletando: {titulo}
          </CardTitle>
          <CardDescription>
            Assine no quadro abaixo usando o mouse ou dedo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <SignaturePad
              ref={padRef}
              width={600}
              height={200}
              className="touch-none bg-white cursor-crosshair"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={cancelarCaptura}
            disabled={salvando}
            className="text-slate-500"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmarAssinatura}
            disabled={salvando}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {salvando ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Salvar Assinatura
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (estado === "concluida" && assinatura) {
    return (
      <Card className="border-emerald-100 bg-emerald-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-emerald-800 flex items-center justify-between">
            {titulo}
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </CardTitle>
          <CardDescription className="text-xs">
            Assinado em {new Date(assinatura.criadoEm).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 w-full border border-emerald-100 bg-white rounded flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Assinatura"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400">
                Visualização indisponível
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          {downloadUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              onClick={() => window.open(downloadUrl, "_blank")}
            >
              <Download className="mr-2 size-4" />
              Baixar Arquivo
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card
      className={`transition-all ${
        estado === "ativa"
          ? "border-emerald-400 shadow-md ring-2 ring-emerald-100"
          : "border-slate-200 opacity-70 grayscale"
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-slate-700 flex items-center justify-between">
          {titulo}
          {estado === "ativa" && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          )}
        </CardTitle>
        <CardDescription>
          {estado === "ativa"
            ? "Aguardando assinatura"
            : "Aguarde a etapa anterior"}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          className={`w-full ${
            estado === "ativa"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-slate-100 text-slate-400"
          }`}
          disabled={estado !== "ativa"}
          onClick={iniciarCaptura}
        >
          <PenTool className="mr-2 size-4" />
          Assinar Agora
        </Button>
      </CardFooter>
    </Card>
  );
}
