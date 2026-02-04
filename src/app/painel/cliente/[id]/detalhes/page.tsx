"use client";
import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { StatusPagamento } from "@/types/PaymentType";
import { useClienteDetalhes } from "@/hooks/queries/useClienteDetalhes";
import { ClienteEditDialog } from "@/components/Titular/Cliente/ClienteEditDialog";
import { criarDependente } from "@/services/dependente.service";
import api from "@/utils/api";
import { extractApiError } from "@/utils/httpError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AsaasWingsMark } from "@/components/ui/AsaasWingsMark";

const DetalhesCliente = () => {
  const params = useParams();
  const clienteId = params?.id as string | undefined;
  const [abaAtiva, setAbaAtiva] = useState("geral");
  const [openEdit, setOpenEdit] = useState(false);
  const [limiteBeneficiarios, setLimiteBeneficiarios] = useState<number | null>(
    null,
  );
  const [dependenteForm, setDependenteForm] = useState({
    nome: "",
    dataNascimento: "",
    parentesco: "",
  });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ATIVO":
        return "text-green-600 bg-green-100";
      case "PENDENTE":
        return "text-yellow-600 bg-yellow-100";
      case "INADIMPLENTE":
        return "text-red-600 bg-red-100";
      case "CANCELADO":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusPagamento = (status: StatusPagamento) => {
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
      default:
        return { icon: XCircle, color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

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
          setLimiteBeneficiarios(limite);
        } else {
          setLimiteBeneficiarios(null);
        }
      })
      .catch(() => {
        if (ativo) setLimiteBeneficiarios(null);
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
    if (
      limiteBeneficiarios &&
      limiteBeneficiarios > 0 &&
      (cliente?.dependentes?.length ?? 0) >= limiteBeneficiarios
    ) {
      toast.error(
        `Limite de beneficiários (${limiteBeneficiarios}) já atingido para este cliente.`,
      );
      return;
    }
    criarDependenteMutation.mutate({
      nome: dependenteForm.nome,
      dataNascimento: dependenteForm.dataNascimento,
      parentesco: dependenteForm.parentesco || "Outro",
    });
  };

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
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Não foi possível carregar o cliente
          </h2>
          {error instanceof Error && (
            <p className="text-gray-500">{error.message}</p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cliente não encontrado
          </h2>
          <button
            onClick={() => router.back()}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const abas = [
    { id: "geral", nome: "Visão Geral", icon: User },
    { id: "coberturas", nome: "Coberturas", icon: Shield },
    { id: "dependentes", nome: "Dependentes", icon: Users },
    { id: "financeiro", nome: "Financeiro", icon: CreditCard },
  ];
  const limiteAtingido =
    !!limiteBeneficiarios &&
    limiteBeneficiarios > 0 &&
    cliente.dependentes.length >= limiteBeneficiarios;

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
                  {cliente.nome}
                </h1>
                <p className="text-sm text-gray-500">CPF: {cliente.cpf}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cliente.statusPlano)}`}
              >
                {cliente.statusPlano}
              </span>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                onClick={() => setOpenEdit(true)}
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
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

      {/* Conteúdo das abas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {abaAtiva === "geral" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações Pessoais */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Nome Completo</p>
                      <p className="font-medium">{cliente.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Idade</p>
                      <p className="font-medium">{cliente.idade} anos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{cliente.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Telefone</p>
                      <p className="font-medium">{cliente.telefone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Endereço
                </h3>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">
                      {cliente.endereco.logradouro}, {cliente.endereco.numero}
                      {cliente.endereco.complemento &&
                        `, ${cliente.endereco.complemento}`}
                    </p>
                    <p className="text-gray-600">
                      {cliente.endereco.bairro}, {cliente.endereco.cidade} -{" "}
                      {cliente.endereco.uf}
                    </p>
                    <p className="text-gray-600">CEP: {cliente.endereco.cep}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo do Plano */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Plano Atual
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {cliente.plano.nome}
                    </p>
                    <p className="text-gray-600">
                      R$ {cliente.plano.valorMensal.toFixed(2)}/mês
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contratação:</span>
                      <span className="font-medium">
                        {new Date(cliente.dataContratacao).toLocaleDateString(
                          "pt-BR",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carência:</span>
                      <span className="font-medium">
                        {cliente.carenciaRestante} dias
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vencimento:</span>
                      <span className="font-medium">
                        Todo dia {cliente.diaVencimento}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultor Responsável */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Consultor Responsável
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">{cliente.consultor.nome}</p>
                  <p className="text-gray-600">
                    Código: {cliente.consultor.codigo}
                  </p>
                  <p className="text-gray-600">{cliente.consultor.email}</p>
                  <p className="text-gray-600">{cliente.consultor.telefone}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "coberturas" && (
          <div className="space-y-8">
            {/* Serviços Padrão Inclusos */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Serviços Padrão Inclusos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cliente.plano.coberturas.servicosPadrao.map(
                  (servico, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {servico.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {servico.descricao}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Cobertura e Translado */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Cobertura e Translado
              </h3>
              <div className="space-y-4">
                {cliente.plano.coberturas.coberturaTranslado.map(
                  (cobertura, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg"
                    >
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {cobertura.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {cobertura.descricao}
                        </p>
                        {cobertura.observacoes && (
                          <p className="text-sm text-orange-600 mt-1">
                            ⚠️ {cobertura.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Serviços Específicos do Plano */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Serviços Específicos do Plano
              </h3>
              <div className="space-y-4">
                {cliente.plano.coberturas.servicosEspecificos.map(
                  (servico, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg"
                    >
                      <Gift className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {servico.nome}
                        </p>
                        <p className="text-sm text-gray-600">
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
              <h3 className="text-lg font-semibold text-gray-900">
                Dependentes ({cliente.dependentes.length})
              </h3>
              {limiteBeneficiarios && limiteBeneficiarios > 0 ? (
                <span className="text-sm text-gray-500">
                  Limite: {limiteBeneficiarios}
                </span>
              ) : null}
            </div>

            <form
              className="bg-white rounded-lg shadow-sm p-6 space-y-4"
              onSubmit={handleAdicionarDependente}
            >
              {limiteAtingido ? (
                <p className="text-sm text-red-600">
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
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-60"
                  disabled={criarDependenteMutation.isPending || limiteAtingido}
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {criarDependenteMutation.isPending
                      ? "Adicionando..."
                      : "Adicionar Dependente"}
                  </span>
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cliente.dependentes.map((dependente) => (
                <div
                  key={dependente.id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {dependente.nome}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {dependente.parentesco}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Idade:</span>
                      <span className="font-medium">
                        {dependente.idade} anos
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPF:</span>
                      <span className="font-medium">{dependente.cpf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carência:</span>
                      <span className="font-medium">
                        {dependente.carenciaRestante} dias
                      </span>
                    </div>
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
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pagamentos em Dia</p>
                    <p className="text-2xl font-bold text-green-600">1</p>
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
                    <p className="text-2xl font-bold text-yellow-600">1</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valor Mensal</p>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {cliente.plano.valorMensal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Próximo Vencimento</p>
                    <p className="text-lg font-bold text-purple-600">30/11</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico de Pagamentos */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Histórico de Pagamentos
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Vencimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
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
                    {cliente.pagamentos.map((pagamento) => {
                      const StatusIcon = getStatusPagamento(
                        pagamento.status,
                      ).icon;
                      return (
                        <tr key={pagamento.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              {new Date(
                                pagamento.dataVencimento,
                              ).toLocaleDateString("pt-BR")}
                              {(pagamento.asaasPaymentId ||
                                pagamento.asaasSubscriptionId) && (
                                <AsaasWingsMark variant="inline" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            R$ {pagamento.valor.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <StatusIcon
                                className={`w-4 h-4 ${getStatusPagamento(pagamento.status).color}`}
                              />
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusPagamento(pagamento.status).bg} ${getStatusPagamento(pagamento.status).color}`}
                              >
                                {pagamento.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {pagamento.metodoPagamento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-800">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-800">
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
