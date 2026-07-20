"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plano } from "@/types/PlanType";
import api from "@/utils/api";
import { sanitizePlanoArray } from "@/utils/planos";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

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

type PlanoFormState = {
  nome: string;
  valorMensal: string;
  idadeMaxima: string;
  coberturaMaxima: string;
  carenciaDias: string;
  vigenciaMeses: string;
  assistenciaFuneral: string;
  auxilioCemiterio: string;
  taxaInclusaCemiterioPublico: boolean;
  ativo: boolean;
  beneficiariosTexto: string;
  servicosPadraoTexto: string;
  coberturaTransladoTexto: string;
  servicosEspecificosTexto: string;
};

const buildFormState = (plano?: Plano | null): PlanoFormState => {
  const coberturas = mapCoberturasDetalhadas(plano?.coberturas);

  return {
    nome: plano?.nome ?? "",
    valorMensal:
      plano?.valorMensal !== undefined ? String(plano.valorMensal) : "",
    idadeMaxima:
      plano?.idadeMaxima !== null && plano?.idadeMaxima !== undefined
        ? String(plano.idadeMaxima)
        : "",
    coberturaMaxima:
      plano?.coberturaMaxima !== undefined ? String(plano.coberturaMaxima) : "",
    carenciaDias:
      plano?.carenciaDias !== undefined ? String(plano.carenciaDias) : "",
    vigenciaMeses:
      plano?.vigenciaMeses !== undefined ? String(plano.vigenciaMeses) : "",
    assistenciaFuneral:
      plano?.assistenciaFuneral !== undefined
        ? String(plano.assistenciaFuneral)
        : "",
    auxilioCemiterio:
      plano?.auxilioCemiterio !== null && plano?.auxilioCemiterio !== undefined
        ? String(plano.auxilioCemiterio)
        : "",
    taxaInclusaCemiterioPublico: Boolean(
      plano?.taxaInclusaCemiterioPublico ?? false,
    ),
    ativo: Boolean(plano?.ativo ?? true),
    beneficiariosTexto: getBeneficiariosNomes(plano?.beneficiarios).join(", "),
    servicosPadraoTexto: coberturas.servicosPadrao.join(", "),
    coberturaTransladoTexto: coberturas.coberturaTranslado.join(", "),
    servicosEspecificosTexto: [
      ...coberturas.servicosEspecificos,
      ...coberturas.outros,
    ].join(", "),
  };
};

const toNumber = (value: string, fallback = 0) => {
  if (value === undefined || value === null) return fallback;
  const normalized = value.toString().replace(",", ".").trim();
  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBeneficiariosTexto = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(
      (item, index, array) => item.length > 0 && array.indexOf(item) === index,
    );

const parseItensTexto = (value: string): string[] =>
  value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(
      (item, index, array) => item.length > 0 && array.indexOf(item) === index,
    );

const GestaoPlanos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [formPlano, setFormPlano] = useState<PlanoFormState>(() =>
    buildFormState(null),
  );
  const [isSavingPlano, setIsSavingPlano] = useState(false);
  const [planoEmExclusao, setPlanoEmExclusao] = useState<string | null>(null);
  const [feedbackMensagem, setFeedbackMensagem] = useState<string | null>(null);
  const router = useRouter();
  const { hasPermission, loading } = useAuth();
  const canView = hasPermission("plano.view");
  const canCreate = hasPermission("plano.create");
  const canUpdate = hasPermission("plano.update");
  const canDelete = hasPermission("plano.delete");
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
      sanitized.sort((a, b) => {
        if (a.valorMensal !== b.valorMensal) {
          return a.valorMensal - b.valorMensal;
        }
        return a.nome.localeCompare(b.nome);
      });
      return sanitized;
    },
    staleTime: 60_000,
    enabled: canView,
  });

  const planos = useMemo(() => planosData ?? [], [planosData]);

  useEffect(() => {
    setFormPlano(buildFormState(planoSelecionado));
    setFeedbackMensagem(null);
  }, [planoSelecionado]);

  const onVoltar = () => {
    router.push("/painel/dashboard");
  };

  const getCsvValue = (value: string | number | null | undefined) => {
    const normalized = String(value ?? "").replace(/"/g, '""');
    return `"${normalized}"`;
  };

  const handleExportarPlanos = () => {
    const headers = [
      "ID",
      "Plano",
      "Valor Mensal",
      "Idade Maxima",
      "Clientes",
      "Receita Mensal",
      "Status",
    ];
    const rows = planosFiltrados.map((plano) => [
      plano.id,
      plano.nome,
      Number(plano.valorMensal ?? 0).toFixed(2),
      plano.idadeMaxima ?? "",
      plano.totalClientes ?? 0,
      Number(plano.receitaMensal ?? 0).toFixed(2),
      plano.ativo ? "Ativo" : "Inativo",
    ]);
    const csv = [
      headers.map((header) => getCsvValue(header)).join(";"),
      ...rows.map((row) => row.map((value) => getCsvValue(value)).join(";")),
    ].join("\n");
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "planos.csv";
    link.click();
    window.URL.revokeObjectURL(url);
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Você não tem permissão para visualizar planos.
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditarPlano = (plano: Plano) => {
    if (!canUpdate) return;
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
    if (!canCreate) return;
    setPlanoSelecionado(null);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const handleCampoPlano = (
    field: keyof PlanoFormState,
    value: string | boolean,
  ) => {
    setFormPlano((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvarPlano = async () => {
    if (planoSelecionado && !canUpdate) return;
    if (!planoSelecionado && !canCreate) return;
    if (!formPlano.nome.trim()) {
      setFeedbackMensagem("Informe o nome do plano.");
      return;
    }

    setIsSavingPlano(true);
    setFeedbackMensagem(null);
    try {
      const beneficiarios = parseBeneficiariosTexto(
        formPlano.beneficiariosTexto,
      );
      const servicosPadrao = parseItensTexto(formPlano.servicosPadraoTexto);
      const coberturaTranslado = parseItensTexto(
        formPlano.coberturaTransladoTexto,
      );
      const servicosEspecificos = parseItensTexto(
        formPlano.servicosEspecificosTexto,
      );
      const payload = {
        nome: formPlano.nome.trim(),
        valorMensal: toNumber(
          formPlano.valorMensal,
          planoSelecionado?.valorMensal ?? 0,
        ),
        idadeMaxima:
          formPlano.idadeMaxima.trim() === ""
            ? null
            : toNumber(
                formPlano.idadeMaxima,
                planoSelecionado?.idadeMaxima ?? 0,
              ),
        coberturaMaxima: toNumber(
          formPlano.coberturaMaxima,
          planoSelecionado?.coberturaMaxima ?? 0,
        ),
        carenciaDias: toNumber(
          formPlano.carenciaDias,
          planoSelecionado?.carenciaDias ?? 0,
        ),
        vigenciaMeses: toNumber(
          formPlano.vigenciaMeses,
          planoSelecionado?.vigenciaMeses ?? 0,
        ),
        assistenciaFuneral: toNumber(
          formPlano.assistenciaFuneral,
          planoSelecionado?.assistenciaFuneral ?? 0,
        ),
        auxilioCemiterio:
          formPlano.auxilioCemiterio.trim() === ""
            ? null
            : toNumber(
                formPlano.auxilioCemiterio,
                planoSelecionado?.auxilioCemiterio ?? 0,
              ),
        taxaInclusaCemiterioPublico: formPlano.taxaInclusaCemiterioPublico,
        ativo: formPlano.ativo,
        beneficiarios,
        coberturas: {
          servicosPadrao,
          coberturaTranslado,
          servicosEspecificos,
        },
      };

      if (planoSelecionado) {
        const planoIdNumber = Number(planoSelecionado.id);
        const endpointId = Number.isNaN(planoIdNumber)
          ? planoSelecionado.id
          : planoIdNumber;
        await api.put(`/plano/${endpointId}`, payload);
      } else {
        await api.post("/plano", payload);
      }

      await refetch();
      setModalAberto(false);
      setPlanoSelecionado(null);
      setModoEdicao(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível salvar o plano.";
      setFeedbackMensagem(message);
    } finally {
      setIsSavingPlano(false);
    }
  };

  const handleExcluirPlano = async (plano: Plano) => {
    if (!canDelete) return;
    const confirmacao = window.confirm(
      `Deseja realmente excluir o plano "${plano.nome}"?`,
    );
    if (!confirmacao) return;

    setPlanoEmExclusao(String(plano.id));
    setFeedbackMensagem(null);
    try {
      const planoIdNumber = Number(plano.id);
      const endpointId = Number.isNaN(planoIdNumber) ? plano.id : planoIdNumber;
      await api.delete(`/plano/${endpointId}`);
      await refetch();
      if (planoSelecionado?.id === plano.id) {
        setModalAberto(false);
        setPlanoSelecionado(null);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o plano.";
      setFeedbackMensagem(message);
    } finally {
      setPlanoEmExclusao(null);
    }
  };

  const beneficiariosSelecionados = planoSelecionado
    ? getBeneficiariosNomes(planoSelecionado.beneficiarios)
    : [];
  const beneficiariosDigitados = parseBeneficiariosTexto(
    formPlano.beneficiariosTexto,
  );
  const servicosPadraoDigitados = parseItensTexto(
    formPlano.servicosPadraoTexto,
  );
  const coberturaTransladoDigitada = parseItensTexto(
    formPlano.coberturaTransladoTexto,
  );
  const servicosEspecificosDigitados = parseItensTexto(
    formPlano.servicosEspecificosTexto,
  );
  const isNovoPlano = modoEdicao && !planoSelecionado;
  const planoDetalhe = planoSelecionado ?? {
    id: "",
    nome: "",
    valorMensal: 0,
    idadeMaxima: null,
    coberturaMaxima: 0,
    carenciaDias: 0,
    vigenciaMeses: 0,
    ativo: true,
    totalClientes: 0,
    receitaMensal: 0,
    assistenciaFuneral: 0,
    auxilioCemiterio: null,
    taxaInclusaCemiterioPublico: false,
    beneficios: [],
    coberturas: [],
    beneficiarios: [],
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-destructive font-semibold text-lg">
              Não foi possível carregar os planos.
            </div>
            <p className="text-sm text-muted-foreground">
              {error?.message || "Tente novamente em instantes."}
            </p>
            <Button onClick={() => refetch()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                onClick={onVoltar}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Gestão de Planos</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie os planos de assistência familiar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExportarPlanos}>
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button onClick={handleNovoPlano} disabled={!canCreate}>
                <Plus className="w-4 h-4" />
                Novo Plano
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                className="pl-10"
                placeholder="Buscar planos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#f2faf0] rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Planos</p>
                <p className="text-2xl font-bold text-primary">
                  {planos.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total de Clientes
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalClientes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(receitaMensalTotal)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planos Ativos</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {planosAtivos}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Planos */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold">
              Planos ({planosFiltrados.length})
            </h3>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Idade Mínima</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Receita Mensal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum plano encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                planosFiltrados.map((plano) => (
                  <TableRow key={plano.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f2faf0] rounded-full flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {plano.nome}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Carência: {plano.carenciaDias} dias
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(plano.valorMensal)}
                    </TableCell>
                    <TableCell>
                      {plano.idadeMaxima
                        ? `${plano.idadeMaxima} anos`
                        : "Sem limite"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {plano.totalClientes ?? 0}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(plano.receitaMensal)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plano.ativo ? "default" : "outline"}>
                        {plano.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => handleVisualizarPlano(plano)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => handleEditarPlano(plano)}
                          disabled={!canUpdate}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleExcluirPlano(plano)}
                          title="Excluir"
                          disabled={
                            planoEmExclusao === String(plano.id) || !canDelete
                          }
                        >
                          {planoEmExclusao === String(plano.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Detalhes/Edição do Plano */}
      <Dialog
        open={modalAberto && Boolean(planoSelecionado || isNovoPlano)}
        onOpenChange={(open) => {
          if (open) return;
          setModalAberto(false);
          setPlanoSelecionado(null);
          setModoEdicao(false);
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNovoPlano
                ? "Novo Plano"
                : `${modoEdicao ? "Editar Plano" : "Detalhes do Plano"} - ${planoSelecionado?.nome ?? ""}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Informações Básicas</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nome do Plano</Label>
                    {modoEdicao ? (
                      <Input
                        value={formPlano.nome}
                        onChange={(e) =>
                          handleCampoPlano("nome", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">{planoDetalhe.nome}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valor Mensal</Label>
                    {modoEdicao ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formPlano.valorMensal}
                        onChange={(e) =>
                          handleCampoPlano("valorMensal", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">
                        {formatCurrency(planoDetalhe.valorMensal)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Idade mínima de entrada</Label>
                    {modoEdicao ? (
                      <Input
                        type="number"
                        min="0"
                        value={formPlano.idadeMaxima}
                        onChange={(e) =>
                          handleCampoPlano("idadeMaxima", e.target.value)
                        }
                        placeholder="Sem limite"
                      />
                    ) : (
                      <p className="font-medium">
                        {planoDetalhe.idadeMaxima
                          ? `${planoDetalhe.idadeMaxima} anos`
                          : "Sem limite"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cobertura Máxima</Label>
                    {modoEdicao ? (
                      <Input
                        type="number"
                        min="0"
                        value={formPlano.coberturaMaxima}
                        onChange={(e) =>
                          handleCampoPlano("coberturaMaxima", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">
                        {planoDetalhe.coberturaMaxima} pessoas
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Estatísticas</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-normal">
                      Total de Clientes
                    </Label>
                    <p className="font-medium">{planoDetalhe.totalClientes}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground font-normal">
                      Receita Mensal
                    </Label>
                    <p className="font-medium">
                      {formatCurrency(planoDetalhe.receitaMensal)}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Carência</Label>
                    {modoEdicao ? (
                      <Input
                        type="number"
                        min="0"
                        value={formPlano.carenciaDias}
                        onChange={(e) =>
                          handleCampoPlano("carenciaDias", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">
                        {planoDetalhe.carenciaDias} dias
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vigência</Label>
                    {modoEdicao ? (
                      <Input
                        type="number"
                        min="1"
                        value={formPlano.vigenciaMeses}
                        onChange={(e) =>
                          handleCampoPlano("vigenciaMeses", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">
                        {planoDetalhe.vigenciaMeses} meses
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Assistência Funeral</Label>
                    {modoEdicao ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formPlano.assistenciaFuneral}
                        onChange={(e) =>
                          handleCampoPlano("assistenciaFuneral", e.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">
                        {formatCurrency(planoDetalhe.assistenciaFuneral)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Auxílio Cemitério</Label>
                    {modoEdicao ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formPlano.auxilioCemiterio}
                        onChange={(e) =>
                          handleCampoPlano("auxilioCemiterio", e.target.value)
                        }
                        placeholder="0,00"
                      />
                    ) : (
                      <p className="font-medium">
                        {planoDetalhe.auxilioCemiterio
                          ? formatCurrency(planoDetalhe.auxilioCemiterio)
                          : "Não informado"}
                      </p>
                    )}
                  </div>
                  <div
                    className={`flex ${modoEdicao ? "border rounded-lg justify-between items-center py-2 px-3" : "flex-col gap-1.5"}`}
                  >
                    <p className="text-sm text-muted-foreground">
                      Taxa Inclusa em Cemitérios Públicos
                    </p>
                    {modoEdicao ? (
                      <Checkbox
                        checked={formPlano.taxaInclusaCemiterioPublico}
                        onCheckedChange={(checked) =>
                          handleCampoPlano(
                            "taxaInclusaCemiterioPublico",
                            checked === true,
                          )
                        }
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {planoDetalhe.taxaInclusaCemiterioPublico
                          ? "Sim"
                          : "Não"}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    {modoEdicao ? (
                      <Select
                        value={formPlano.ativo ? "true" : "false"}
                        onValueChange={(v) =>
                          handleCampoPlano("ativo", v === "true")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Ativo</SelectItem>
                          <SelectItem value="false">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">
                        {planoDetalhe.ativo ? "Ativo" : "Inativo"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Beneficiários */}
            <div className="space-y-3">
              <h4 className="font-semibold">Beneficiários Cobertos</h4>
              {modoEdicao ? (
                <div className="space-y-3">
                  <Textarea
                    className="min-h-[90px]"
                    placeholder="Ex: Titular, Cônjuge, Filhos"
                    value={formPlano.beneficiariosTexto}
                    onChange={(e) =>
                      handleCampoPlano("beneficiariosTexto", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe os beneficiários separados por vírgula.
                  </p>
                  {beneficiariosDigitados.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {beneficiariosDigitados.map((beneficiario, index) => (
                        <div
                          key={`${beneficiario}-${index}`}
                          className="flex items-center gap-2 p-2 bg-[#f2faf0] rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-sm">{beneficiario}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum beneficiário informado.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {beneficiariosSelecionados.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {beneficiariosSelecionados.map((beneficiario, index) => (
                        <div
                          key={`${beneficiario}-${index}`}
                          className="flex items-center gap-2 p-2 bg-[#f2faf0] rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <span className="text-sm">{beneficiario}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum beneficiário cadastrado para este plano.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Coberturas */}
            <div className="space-y-4">
              <h4 className="font-semibold">Coberturas Incluídas</h4>
              {modoEdicao ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Serviços Padrão Inclusos</Label>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Ex: Velório, Urna padrão, Ornamentação básica"
                      value={formPlano.servicosPadraoTexto}
                      onChange={(e) =>
                        handleCampoPlano("servicosPadraoTexto", e.target.value)
                      }
                    />
                    {servicosPadraoDigitados.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {servicosPadraoDigitados.map((item, index) => (
                          <div
                            key={`padrao-edit-${index}`}
                            className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Cobertura e Translado</Label>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Ex: Translado até 1000 km rodados"
                      value={formPlano.coberturaTransladoTexto}
                      onChange={(e) =>
                        handleCampoPlano(
                          "coberturaTransladoTexto",
                          e.target.value,
                        )
                      }
                    />
                    {coberturaTransladoDigitada.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {coberturaTransladoDigitada.map((item, index) => (
                          <div
                            key={`translado-edit-${index}`}
                            className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg"
                          >
                            <Shield className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Serviços Específicos do Plano</Label>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Ex: Cerimonial especial, Coroa de flores premium"
                      value={formPlano.servicosEspecificosTexto}
                      onChange={(e) =>
                        handleCampoPlano(
                          "servicosEspecificosTexto",
                          e.target.value,
                        )
                      }
                    />
                    {servicosEspecificosDigitados.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {servicosEspecificosDigitados.map((item, index) => (
                          <div
                            key={`especifico-edit-${index}`}
                            className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg"
                          >
                            <Shield className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Separe itens por vírgula, ponto e vírgula ou quebra de
                    linha.
                  </p>
                </div>
              ) : (
                <>
                  {coberturasSelecionadas.servicosPadrao.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">
                        Serviços Padrão Inclusos
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {coberturasSelecionadas.servicosPadrao.map(
                          (servico, index) => (
                            <div
                              key={`padrao-${index}`}
                              className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
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
                      <h5 className="font-medium mb-2">
                        Cobertura e Translado
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {coberturasSelecionadas.coberturaTranslado.map(
                          (cobertura, index) => (
                            <div
                              key={`translado-${index}`}
                              className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg"
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
                      <h5 className="font-medium mb-2">
                        Serviços Específicos do Plano
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {coberturasSelecionadas.servicosEspecificos.map(
                          (servico, index) => (
                            <div
                              key={`especifico-${index}`}
                              className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg"
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
                      <h5 className="font-medium mb-2">Outras Coberturas</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {coberturasSelecionadas.outros.map(
                          (descricao, index) => (
                            <div
                              key={`outros-${index}`}
                              className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg"
                            >
                              <Shield className="w-4 h-4 text-slate-600" />
                              <span className="text-sm">{descricao}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {!possuiCoberturas && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma cobertura cadastrada para este plano.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {feedbackMensagem && (
              <p className="text-sm text-destructive">{feedbackMensagem}</p>
            )}
            <div className="flex flex-wrap justify-end gap-2 ml-auto">
              {modoEdicao && planoSelecionado && (
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleExcluirPlano(planoSelecionado)}
                  disabled={planoEmExclusao === String(planoSelecionado.id)}
                >
                  {planoEmExclusao === String(planoSelecionado.id) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Excluir Plano"
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setModalAberto(false);
                  setPlanoSelecionado(null);
                  setModoEdicao(false);
                }}
              >
                Fechar
              </Button>
              {modoEdicao && (
                <Button onClick={handleSalvarPlano} disabled={isSavingPlano}>
                  {isSavingPlano ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : isNovoPlano ? (
                    "Criar Plano"
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestaoPlanos;
