"use client";
import React, { useMemo, useState } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Users,
  CheckCircle,
  Search,
  Filter,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plano } from "@/types/PlanType";
import api from "@/utils/api";
import { sanitizePlanoArray } from "@/utils/planos";

const formatCurrency = (value?: number | null) =>
  `R$ ${Number(value ?? 0).toFixed(2)}`;

const getBeneficiariosNomes = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const nome = (item as Record<string, unknown>).nome;
        if (typeof nome === "string") return nome;
      }
      return null;
    })
    .filter(
      (nome): nome is string => typeof nome === "string" && nome.length > 0,
    );
};

type CoberturasDetalhadas = {
  servicosPadrao: string[];
  coberturaTranslado: string[];
  servicosEspecificos: string[];
  outros: string[];
};

const mapCoberturasDetalhadas = (value: unknown): CoberturasDetalhadas => {
  const base: CoberturasDetalhadas = {
    servicosPadrao: [],
    coberturaTranslado: [],
    servicosEspecificos: [],
    outros: [],
  };

  if (!value) return base;

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const registro = item as Record<string, unknown>;
      const descricao =
        typeof registro.descricao === "string" ? registro.descricao : "";
      if (!descricao) return;
      const tipoRaw =
        typeof registro.tipo === "string"
          ? registro.tipo
          : typeof registro.nome === "string"
            ? registro.nome
            : "";
      const tipo = tipoRaw.toLowerCase();
      if (tipo.includes("padrao")) {
        base.servicosPadrao.push(descricao);
      } else if (tipo.includes("translado")) {
        base.coberturaTranslado.push(descricao);
      } else if (tipo.includes("especific") || tipo.includes("adicional")) {
        base.servicosEspecificos.push(descricao);
      } else {
        base.outros.push(descricao);
      }
    });
    return base;
  }

  if (typeof value === "object") {
    const registro = value as Record<string, unknown>;
    const pushStrings = (
      key: keyof CoberturasDetalhadas,
      maybeArray: unknown,
    ) => {
      if (!Array.isArray(maybeArray)) return;
      maybeArray.forEach((item) => {
        if (typeof item === "string" && item.trim() !== "") {
          base[key].push(item);
        }
      });
    };

    pushStrings("servicosPadrao", registro.servicosPadrao);
    pushStrings("coberturaTranslado", registro.coberturaTranslado);
    pushStrings("servicosEspecificos", registro.servicosEspecificos);

    Object.entries(registro).forEach(([key, maybeArray]) => {
      if (
        key === "servicosPadrao" ||
        key === "coberturaTranslado" ||
        key === "servicosEspecificos"
      )
        return;
      if (Array.isArray(maybeArray)) {
        maybeArray.forEach((item) => {
          if (typeof item === "string" && item.trim() !== "") {
            base.outros.push(item);
          }
        });
      }
    });
  }

  return base;
};

const GestaoPlanos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const router = useRouter();
  const {
    data: planosData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Plano[], Error>({
    queryKey: ["planos", "lista"],
    queryFn: async () => {
      const response = await api.get("/plano");
      const sanitized = sanitizePlanoArray(response.data);
      sanitized.sort((a, b) => a.nome.localeCompare(b.nome));
      return sanitized;
    },
    staleTime: 60_000,
  });

  const planos = useMemo(() => planosData ?? [], [planosData]);

  const onVoltar = () => {
    router.push("/painel/dashboard");
  };

  const planosFiltrados = useMemo(() => {
    return planos.filter((plano) => {
      const matchSearch = plano.nome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativo" && plano.ativo) ||
        (filtroStatus === "inativo" && !plano.ativo);
      return matchSearch && matchStatus;
    });
  }, [planos, searchTerm, filtroStatus]);

  const totalClientes = useMemo(
    () => planos.reduce((sum, plano) => sum + (plano.totalClientes ?? 0), 0),
    [planos],
  );

  const receitaMensalTotal = useMemo(
    () => planos.reduce((sum, plano) => sum + (plano.receitaMensal ?? 0), 0),
    [planos],
  );

  const planosAtivos = useMemo(
    () => planos.filter((p) => p.ativo).length,
    [planos],
  );

  const handleEditarPlano = (plano: Plano) => {
    setPlanoSelecionado(plano);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const handleVisualizarPlano = (plano: Plano) => {
    setPlanoSelecionado(plano);
    setModoEdicao(false);
    setModalAberto(true);
  };

  const handleNovoPlano = () => {
    setPlanoSelecionado(null);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const getStatusColor = (ativo: boolean) => {
    return ativo ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100";
  };

  const beneficiariosSelecionados = planoSelecionado
    ? getBeneficiariosNomes(planoSelecionado.beneficiarios)
    : [];

  const coberturasSelecionadas = planoSelecionado
    ? mapCoberturasDetalhadas(planoSelecionado.coberturas)
    : mapCoberturasDetalhadas(undefined);

  const possuiCoberturas =
    coberturasSelecionadas.servicosPadrao.length > 0 ||
    coberturasSelecionadas.coberturaTranslado.length > 0 ||
    coberturasSelecionadas.servicosEspecificos.length > 0 ||
    coberturasSelecionadas.outros.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center space-y-4">
          <div className="text-red-600 font-semibold text-lg">
            Não foi possível carregar os planos.
          </div>
          <p className="text-sm text-gray-600">
            {error?.message || "Tente novamente em instantes."}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
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
                onClick={onVoltar}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Gestão de Planos
                </h1>
                <p className="text-sm text-gray-500">
                  Gerencie os planos de assistência familiar
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
              <button
                onClick={handleNovoPlano}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Plano</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar planos..."
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
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Planos</p>
                <p className="text-2xl font-bold text-green-600">
                  {planos.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalClientes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(receitaMensalTotal)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Planos Ativos</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {planosAtivos}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Planos */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Planos ({planosFiltrados.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Mensal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Idade Máxima
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clientes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receita Mensal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planosFiltrados.map((plano) => (
                  <tr key={plano.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {plano.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            Carência: {plano.carenciaDias} dias
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(plano.valorMensal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {plano.idadeMaxima
                          ? `${plano.idadeMaxima} anos`
                          : "Sem limite"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {plano.totalClientes ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(plano.receitaMensal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(plano.ativo)}`}
                      >
                        {plano.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleVisualizarPlano(plano)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditarPlano(plano)}
                          className="text-green-600 hover:text-green-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Desativar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes/Edição do Plano */}
      {modalAberto && planoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modoEdicao ? "Editar Plano" : "Detalhes do Plano"} -{" "}
                  {planoSelecionado.nome}
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
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Informações Básicas
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">
                        Nome do Plano
                      </label>
                      <p className="font-medium">{planoSelecionado.nome}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Valor Mensal
                      </label>
                      <p className="font-medium">
                        {formatCurrency(planoSelecionado.valorMensal)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Idade Máxima
                      </label>
                      <p className="font-medium">
                        {planoSelecionado.idadeMaxima
                          ? `${planoSelecionado.idadeMaxima} anos`
                          : "Sem limite"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Cobertura Máxima
                      </label>
                      <p className="font-medium">
                        {planoSelecionado.coberturaMaxima} pessoas
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Estatísticas
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">
                        Total de Clientes
                      </label>
                      <p className="font-medium">
                        {planoSelecionado.totalClientes}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Receita Mensal
                      </label>
                      <p className="font-medium">
                        {formatCurrency(planoSelecionado.receitaMensal)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Carência</label>
                      <p className="font-medium">
                        {planoSelecionado.carenciaDias} dias
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Vigência</label>
                      <p className="font-medium">
                        {planoSelecionado.vigenciaMeses} meses
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beneficiários */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Beneficiários Cobertos
                </h4>
                {beneficiariosSelecionados.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {beneficiariosSelecionados.map((beneficiario, index) => (
                      <div
                        key={`${beneficiario}-${index}`}
                        className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{beneficiario}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhum beneficiário cadastrado para este plano.
                  </p>
                )}
              </div>

              {/* Coberturas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Coberturas Incluídas
                </h4>

                {coberturasSelecionadas.servicosPadrao.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">
                      Serviços Padrão Inclusos
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {coberturasSelecionadas.servicosPadrao.map(
                        (servico, index) => (
                          <div
                            key={`padrao-${index}`}
                            className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{servico}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {coberturasSelecionadas.coberturaTranslado.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">
                      Cobertura e Translado
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {coberturasSelecionadas.coberturaTranslado.map(
                        (cobertura, index) => (
                          <div
                            key={`translado-${index}`}
                            className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg"
                          >
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">{cobertura}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {coberturasSelecionadas.servicosEspecificos.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">
                      Serviços Específicos do Plano
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {coberturasSelecionadas.servicosEspecificos.map(
                        (servico, index) => (
                          <div
                            key={`especifico-${index}`}
                            className="flex items-center space-x-2 p-2 bg-emerald-50 rounded-lg"
                          >
                            <Shield className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm">{servico}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {coberturasSelecionadas.outros.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">
                      Outras Coberturas
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {coberturasSelecionadas.outros.map((descricao, index) => (
                        <div
                          key={`outros-${index}`}
                          className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg"
                        >
                          <Shield className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">{descricao}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!possuiCoberturas && (
                  <p className="text-sm text-gray-500">
                    Nenhuma cobertura cadastrada para este plano.
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
              {modoEdicao && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Salvar Alterações
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoPlanos;
