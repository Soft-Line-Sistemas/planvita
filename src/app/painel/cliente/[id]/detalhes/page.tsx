"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Gift,
  Users,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Plus,
  Download,
  Eye,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { StatusPagamento } from "@/types/PaymentType";
import { useClienteDetalhes } from "@/hooks/queries/useClienteDetalhes";
import { ClienteEditDialog } from "@/components/Titular/Cliente/ClienteEditDialog";
import CarteirinhaAsImage from "@/components/CarteirinhaAsImage";
import {
  atualizarDependente,
  criarDependente,
} from "@/services/dependente.service";
import { mapTitularToCarteirinha } from "@/services/clienteCarteirinha.service";
import api from "@/utils/api";
import { extractApiError } from "@/utils/httpError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AsaasWingsMark } from "@/components/ui/AsaasWingsMark";
import { useAuth } from "@/hooks/useAuth";
import { formatDatePtBr } from "@/utils/date";

const MAX_DEPENDENTES_POR_TITULAR = 8;

const DetalhesCliente = () => {
  const params = useParams();
  const clienteId = params?.id as string | undefined;
  const [abaAtiva, setAbaAtiva] = useState("geral");
  const [isFlippedCarteirinha, setIsFlippedCarteirinha] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [limiteBeneficiarios, setLimiteBeneficiarios] = useState<number | null>(
    null,
  );
  const [dependenteForm, setDependenteForm] = useState({
    nome: "",
    dataNascimento: "",
    parentesco: "",
  });
  const [baixandoContrato, setBaixandoContrato] = useState(false);
  const { hasPermission } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    data: cliente,
    isLoading,
    isError,
    error,
    refetch,
  } = useClienteDetalhes(clienteId);

  const criarDependenteMutation = useMutation({
    mutationFn: (payload: {
      nome: string;
      dataNascimento: string;
      parentesco: string;
    }) =>
      criarDependente({
        titularId: Number(clienteId),
        nome: payload.nome,
        dataNascimento: payload.dataNascimento,
        tipoDependente: payload.parentesco,
      }),
    onSuccess: async () => {
      toast.success("Dependente adicionado com sucesso.");
      setDependenteForm({ nome: "", dataNascimento: "", parentesco: "" });
      await refetch();
    },
    onError: (error: unknown) => {
      const { message } = extractApiError(error);
      toast.error(message);
    },
  });
  const podeAlternarIsencaoAdicional = hasPermission(
    "dependente.toggle_adicional_cobranca",
  );

  const atualizarCobrancaDependenteMutation = useMutation({
    mutationFn: (payload: { dependenteId: number; excluir: boolean }) =>
      atualizarDependente({
        id: payload.dependenteId,
        excluirCobrancaAdicional: payload.excluir,
      }),
    onSuccess: async () => {
      toast.success("Cobrança adicional atualizada.");
      await refetch();
    },
    onError: (error: unknown) => {
      const { message } = extractApiError(error);
      toast.error(message);
    },
  });

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "outline" | "secondary" | "destructive" => {
    switch (status) {
      case "ATIVO":
        return "default";
      case "PENDENTE":
        return "secondary";
      case "INADIMPLENTE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusPagamento = (status: StatusPagamento) => {
    switch (status) {
      case "PAGO":
      case "RECEBIDO":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-100",
        };
      case "PENDENTE":
        return { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" };
      case "VENCIDO":
        return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" };
      default:
        return { icon: XCircle, color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  const dataPossivelRenovacao = useMemo(() => {
    if (!cliente?.dataContratacao) return "—";

    const dataBase = new Date(cliente.dataContratacao);
    if (Number.isNaN(dataBase.getTime())) return "—";

    const vigenciaMeses =
      Number(cliente.plano?.vigenciaMeses) > 0
        ? Number(cliente.plano?.vigenciaMeses)
        : 12;

    const renovacao = new Date(dataBase);
    renovacao.setMonth(renovacao.getMonth() + vigenciaMeses);

    return formatDatePtBr(renovacao);
  }, [cliente?.dataContratacao, cliente?.plano?.vigenciaMeses]);

  useEffect(() => {
    if (!searchParams) return;
    const shouldOpen = searchParams.get("editar");
    if (shouldOpen) {
      setOpenEdit(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let ativo = true;
    api
      .get("/regras")
      .then((res) => {
        if (!ativo) return;
        const regra = Array.isArray(res.data) ? res.data[0] : null;
        const limite = Number(regra?.limiteBeneficiarios);
        if (Number.isFinite(limite) && limite > 0) {
          setLimiteBeneficiarios(Math.min(limite, MAX_DEPENDENTES_POR_TITULAR));
        } else {
          setLimiteBeneficiarios(MAX_DEPENDENTES_POR_TITULAR);
        }
      })
      .catch(() => {
        if (ativo) setLimiteBeneficiarios(MAX_DEPENDENTES_POR_TITULAR);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const handleAdicionarDependente = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!clienteId) {
      toast.error("Cliente não identificado.");
      return;
    }
    if (!dependenteForm.nome || !dependenteForm.dataNascimento) {
      toast.error("Informe nome e data de nascimento do dependente.");
      return;
    }
    const limiteAtual = limiteBeneficiarios ?? MAX_DEPENDENTES_POR_TITULAR;
    if (limiteAtual > 0 && (cliente?.dependentes?.length ?? 0) >= limiteAtual) {
      toast.error(
        `Limite de beneficiários (${limiteAtual}) já atingido para este cliente.`,
      );
      return;
    }
    criarDependenteMutation.mutate({
      nome: dependenteForm.nome,
      dataNascimento: dependenteForm.dataNascimento,
      parentesco: dependenteForm.parentesco || "Outro",
    });
  };

  const handleBaixarContrato = async () => {
    if (!clienteId) {
      toast.error("Cliente não identificado.");
      return;
    }

    setBaixandoContrato(true);
    try {
      const response = await api.get(`/titular/${clienteId}/contrato/arquivo`, {
        params: { format: "pdf" },
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `contrato-${cliente?.nome || clienteId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error: unknown) {
      const { message } = extractApiError(error);
      toast.error(message || "Não foi possível baixar o contrato.");
    } finally {
      setBaixandoContrato(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Não foi possível carregar o cliente
          </h2>
          {error instanceof Error && (
            <p className="text-muted-foreground">{error.message}</p>
          )}
        </div>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Cliente não encontrado</h2>
          <Button variant="link" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const abas = [
    { id: "geral", nome: "Visão Geral", icon: User },
    { id: "carteirinha", nome: "Carteirinha", icon: CreditCard },
    { id: "coberturas", nome: "Coberturas", icon: Shield },
    { id: "dependentes", nome: "Dependentes", icon: Users },
    { id: "financeiro", nome: "Financeiro", icon: CreditCard },
  ];
  const limiteAtingido =
    cliente.dependentes.length >=
    (limiteBeneficiarios ?? MAX_DEPENDENTES_POR_TITULAR);
  const totalAdicionaisDependentes = cliente.dependentes.reduce(
    (acc, dep) => acc + Number(dep.valorAdicionalMensal ?? 0),
    0,
  );
  const valorMensalComAdicionais =
    Number(cliente.plano.valorMensal ?? 0) + totalAdicionaisDependentes;
  const titularIdNumber = Number(cliente.id);
  const planoCoberturas = cliente.plano.coberturas as unknown;
  const coberturasNormalizadas = (() => {
    if (Array.isArray(planoCoberturas)) {
      return planoCoberturas.map((item) => ({
        descricao: item.descricao,
        tipo: item.tipo,
      }));
    }

    if (planoCoberturas && typeof planoCoberturas === "object") {
      const grouped = planoCoberturas as {
        servicosPadrao?: Array<{ descricao: string; nome: string }>;
        coberturaTranslado?: Array<{ descricao: string; nome: string }>;
        servicosEspecificos?: Array<{ descricao: string; nome: string }>;
      };

      return [
        ...(grouped.servicosPadrao ?? []),
        ...(grouped.coberturaTranslado ?? []),
        ...(grouped.servicosEspecificos ?? []),
      ].map((item) => ({
        descricao: item.descricao,
        tipo: item.nome,
      }));
    }

    return [];
  })();
  const coberturasPorGrupo = (() => {
    if (
      planoCoberturas &&
      typeof planoCoberturas === "object" &&
      !Array.isArray(planoCoberturas)
    ) {
      const grouped = planoCoberturas as {
        servicosPadrao?: Array<{ nome: string; descricao: string }>;
        coberturaTranslado?: Array<{
          nome: string;
          descricao: string;
          observacoes?: string | null;
        }>;
        servicosEspecificos?: Array<{ nome: string; descricao: string }>;
      };

      return {
        servicosPadrao: grouped.servicosPadrao ?? [],
        coberturaTranslado: grouped.coberturaTranslado ?? [],
        servicosEspecificos: grouped.servicosEspecificos ?? [],
      };
    }

    return {
      servicosPadrao: coberturasNormalizadas.map((item) => ({
        nome: item.tipo,
        descricao: item.descricao,
      })),
      coberturaTranslado: [] as Array<{
        nome: string;
        descricao: string;
        observacoes?: string | null;
      }>,
      servicosEspecificos: [] as Array<{ nome: string; descricao: string }>,
    };
  })();
  const clienteCarteirinha = mapTitularToCarteirinha({
    id: Number.isFinite(titularIdNumber) ? titularIdNumber : null,
    nome: cliente.nome,
    cpf: cliente.cpf,
    email: cliente.email,
    telefone: cliente.telefone,
    statusPlano: cliente.statusPlano,
    dataContratacao: cliente.dataContratacao,
    plano: {
      id: cliente.plano.id,
      nome: cliente.plano.nome,
      valorMensal: Number(cliente.plano.valorMensal ?? 0),
      carenciaDias: Number(cliente.plano.carenciaDias ?? 0),
      vigenciaMeses: Number(cliente.plano.vigenciaMeses ?? 12),
      coberturas: coberturasNormalizadas,
    },
    dependentes: (cliente.dependentes ?? []).map((dep) => {
      const depIdNumber = Number(dep.id);
      return {
        id: Number.isFinite(depIdNumber) ? depIdNumber : null,
        nome: dep.nome,
        dataNascimento: dep.dataNascimento,
        carenciaInicioEm: dep.carenciaInicioEm,
        tipoDependente: dep.parentesco,
        valorAdicionalMensal: Number(dep.valorAdicionalMensal ?? 0),
      };
    }),
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{cliente.nome}</h1>
                <p className="text-sm text-muted-foreground">
                  CPF: {cliente.cpf}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(cliente.statusPlano)}>
                {cliente.statusPlano}
              </Badge>
              <Button onClick={() => setOpenEdit(true)}>
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </div>

          <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
            <TabsList className="h-auto bg-transparent p-0 gap-6 border-b-0">
              {abas.map((aba) => {
                const Icon = aba.icon;
                return (
                  <TabsTrigger
                    key={aba.id}
                    value={aba.id}
                    className="rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Icon className="w-4 h-4" />
                    {aba.nome}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conteúdo das abas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {abaAtiva === "geral" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações Pessoais */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nome Completo
                      </p>
                      <p className="font-medium">{cliente.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Idade</p>
                      <p className="font-medium">{cliente.idade} anos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{cliente.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{cliente.telefone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-medium">
                      {cliente.endereco.logradouro}, {cliente.endereco.numero}
                      {cliente.endereco.complemento &&
                        `, ${cliente.endereco.complemento}`}
                    </p>
                    <p className="text-muted-foreground">
                      {cliente.endereco.bairro}, {cliente.endereco.cidade} -{" "}
                      {cliente.endereco.uf}
                    </p>
                    <p className="text-muted-foreground">
                      CEP: {cliente.endereco.cep}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo do Plano */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Plano Atual</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {cliente.plano.nome}
                    </p>
                    <p className="text-muted-foreground">
                      R$ {valorMensalComAdicionais.toFixed(2)}/mês
                    </p>
                    {totalAdicionaisDependentes > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Base: R$ {cliente.plano.valorMensal.toFixed(2)} + R${" "}
                        {totalAdicionaisDependentes.toFixed(2)} de adicionais
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Contratação:
                      </span>
                      <span className="font-medium">
                        {formatDatePtBr(cliente.dataContratacao)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Possível renovação:
                      </span>
                      <span className="font-medium">
                        {dataPossivelRenovacao}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carência:</span>
                      <span className="font-medium">
                        {cliente.carenciaRestante} dias
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vencimento:</span>
                      <span className="font-medium">
                        Todo dia {cliente.diaVencimento}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleBaixarContrato}
                    disabled={baixandoContrato}
                    className="w-full mt-2"
                  >
                    {baixandoContrato ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {baixandoContrato
                      ? "Gerando contrato..."
                      : "Baixar contrato"}
                  </Button>
                </div>
              </div>

              {/* Consultor Responsável */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Consultor Responsável
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">{cliente.consultor.nome}</p>
                  <p className="text-muted-foreground">
                    Código: {cliente.consultor.codigo}
                  </p>
                  <p className="text-muted-foreground">
                    {cliente.consultor.email}
                  </p>
                  <p className="text-muted-foreground">
                    {cliente.consultor.telefone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "carteirinha" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">
                Carteirinha do Cliente
              </h3>
              <p className="text-sm text-muted-foreground">
                Visualize a carteirinha e faça download em PDF.
              </p>
            </div>

            <CarteirinhaAsImage
              cliente={clienteCarteirinha}
              isFlipped={isFlippedCarteirinha}
              setIsFlipped={setIsFlippedCarteirinha}
              formatDate={(value: string) => formatDatePtBr(value)}
              formatCurrency={(value: number) =>
                value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              }
            />
          </div>
        )}

        {abaAtiva === "coberturas" && (
          <div className="space-y-8">
            {/* Serviços Padrão Inclusos */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">
                Serviços Padrão Inclusos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coberturasPorGrupo.servicosPadrao.map((servico, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-[#f2faf0] rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{servico.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {servico.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cobertura e Translado */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">
                Cobertura e Translado
              </h3>
              <div className="space-y-4">
                {coberturasPorGrupo.coberturaTranslado.map(
                  (cobertura, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg"
                    >
                      <Shield className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{cobertura.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {cobertura.descricao}
                        </p>
                        {cobertura.observacoes && (
                          <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {cobertura.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Serviços Específicos do Plano */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">
                Serviços Específicos do Plano
              </h3>
              <div className="space-y-4">
                {coberturasPorGrupo.servicosEspecificos.map(
                  (servico, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-[#f2faf0] rounded-lg"
                    >
                      <Gift className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{servico.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {servico.descricao}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "dependentes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Dependentes ({cliente.dependentes.length})
              </h3>
              {limiteBeneficiarios && limiteBeneficiarios > 0 ? (
                <span className="text-sm text-muted-foreground">
                  Limite: {limiteBeneficiarios}
                </span>
              ) : null}
            </div>

            <form
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4"
              onSubmit={handleAdicionarDependente}
            >
              {limiteAtingido ? (
                <p className="text-sm text-destructive">
                  Limite de beneficiários atingido para este cliente.
                </p>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dep-nome">Nome completo</Label>
                  <Input
                    id="dep-nome"
                    value={dependenteForm.nome}
                    onChange={(e) =>
                      setDependenteForm((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-data">Data de nascimento</Label>
                  <Input
                    id="dep-data"
                    type="date"
                    value={dependenteForm.dataNascimento}
                    onChange={(e) =>
                      setDependenteForm((prev) => ({
                        ...prev,
                        dataNascimento: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dep-parentesco">Parentesco</Label>
                  <Input
                    id="dep-parentesco"
                    placeholder="Filho, Cônjuge, etc."
                    value={dependenteForm.parentesco}
                    onChange={(e) =>
                      setDependenteForm((prev) => ({
                        ...prev,
                        parentesco: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={criarDependenteMutation.isPending || limiteAtingido}
                >
                  <Plus className="w-4 h-4" />
                  {criarDependenteMutation.isPending
                    ? "Adicionando..."
                    : "Adicionar Dependente"}
                </Button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cliente.dependentes.map((dependente) => (
                <div
                  key={dependente.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#f2faf0] rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{dependente.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          {dependente.parentesco}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Idade:</span>
                      <span className="font-medium">
                        {dependente.idade} anos
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPF:</span>
                      <span className="font-medium">{dependente.cpf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carência:</span>
                      <span className="font-medium">
                        {dependente.carenciaRestante} dias
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adicional:</span>
                      <span className="font-medium">
                        R${" "}
                        {Number(dependente.valorAdicionalMensal ?? 0).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                    {dependente.foraGradeFamiliar ? (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          Excluir cobrança adicional
                        </span>
                        <label className="inline-flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={Boolean(
                              dependente.excluirCobrancaAdicional ?? false,
                            )}
                            disabled={
                              !podeAlternarIsencaoAdicional ||
                              atualizarCobrancaDependenteMutation.isPending
                            }
                            onCheckedChange={(checked) =>
                              atualizarCobrancaDependenteMutation.mutate({
                                dependenteId: Number(dependente.id),
                                excluir: checked === true,
                              })
                            }
                          />
                          {podeAlternarIsencaoAdicional
                            ? "Autorizado"
                            : "Sem permissão"}
                        </label>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground pt-2 border-t border-slate-100">
                        Dependente dentro da grade familiar do plano.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === "financeiro" && (
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pagamentos em Dia
                    </p>
                    <p className="text-2xl font-bold text-green-600">1</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">1</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#f2faf0] rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Valor Mensal
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {valorMensalComAdicionais.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Próximo Vencimento
                    </p>
                    <p className="text-lg font-bold text-slate-700">30/11</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico de Pagamentos */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold">
                  Histórico de Pagamentos
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cliente.pagamentos.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nenhum pagamento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cliente.pagamentos.map((pagamento) => {
                      const StatusIcon = getStatusPagamento(
                        pagamento.status,
                      ).icon;
                      return (
                        <TableRow key={pagamento.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {formatDatePtBr(pagamento.dataVencimento)}
                              {(pagamento.asaasPaymentId ||
                                pagamento.asaasSubscriptionId) && (
                                <AsaasWingsMark variant="inline" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            R$ {pagamento.valor.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusIcon
                                className={`w-4 h-4 ${getStatusPagamento(pagamento.status).color}`}
                              />
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusPagamento(pagamento.status).bg} ${getStatusPagamento(pagamento.status).color}`}
                              >
                                {pagamento.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {pagamento.metodoPagamento}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
      <ClienteEditDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        cliente={cliente}
        onUpdated={() => refetch()}
      />
    </div>
  );
};

export default DetalhesCliente;
