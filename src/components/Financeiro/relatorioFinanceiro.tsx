"use client";
import React, { useMemo, useState } from "react";
import {
  FileText,
  BarChart3,
  ClipboardList,
  Receipt,
  UserCheck,
  Download,
  Filter,
  Calendar,
  RefreshCcw,
  Mail,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";

import { useRelatorioFinanceiro } from "@/hooks/queries/useRelatorioFinanceiro";
import {
  exportRelatorioFinanceiroExcel,
  exportRelatorioFinanceiroPdf,
} from "@/utils/exporters";

const cores = ["#16a34a", "#0ea5e9", "#f97316", "#9333ea"];

const RelatoriosFinanceiro = () => {
  const [relatorio, setRelatorio] = useState("analitico");
  const [filtro, setFiltro] = useState({ periodo: "30dias", tipo: "todos" });
  const [processingAction, setProcessingAction] = useState(false);
  const { data, isLoading, isError, error, refetch } = useRelatorioFinanceiro();

  const totais = data?.totais ?? {
    entradas: 0,
    saidas: 0,
    lucro: 0,
    margem: 0,
  };

  const dadosMensais = data?.mensal ?? [];
  const distribuicaoCategorias = data?.distribuicao ?? [];
  const comissoesVendedores = data?.comissoes ?? [];
  const recibos = data?.recibos ?? [];

  const tendencia = useMemo(() => {
    if (totais.entradas > totais.saidas) {
      return {
        texto: "Lucro crescente",
        icone: <TrendingUp className="text-green-600 w-4 h-4 inline" />,
      };
    }
    if (totais.entradas === 0 && totais.saidas === 0) {
      return {
        texto: "Sem movimentação recente",
        icone: <TrendingDown className="text-gray-400 w-4 h-4 inline" />,
      };
    }
    return {
      texto: "Atenção: despesas acima das receitas",
      icone: <TrendingDown className="text-red-600 w-4 h-4 inline" />,
    };
  }, [totais]);

  const opcoes = [
    { id: "analitico", nome: "Relatório Analítico", icon: ClipboardList },
    { id: "balanco", nome: "Balanço Financeiro", icon: BarChart3 },
    { id: "sintetico", nome: "Relatório Sintético", icon: FileText },
    { id: "recibo", nome: "Relatório de Recibo", icon: Receipt },
    { id: "comissao", nome: "Comissão de Vendedor", icon: UserCheck },
  ];

  // =========================
  // 🔹 FUNÇÕES
  // =========================

  const exportar = async (tipo: "pdf" | "excel") => {
    if (!data) return;
    setProcessingAction(true);
    try {
      const suffix = relatorio.charAt(0).toUpperCase() + relatorio.slice(1);
      if (tipo === "pdf") {
        exportRelatorioFinanceiroPdf(
          data,
          `relatorio-${suffix}-${Date.now()}.pdf`,
        );
      } else {
        exportRelatorioFinanceiroExcel(
          data,
          `relatorio-${suffix}-${Date.now()}.xlsx`,
        );
      }
    } finally {
      setProcessingAction(false);
    }
  };

  const enviarEmail = () => {
    setProcessingAction(true);
    setTimeout(() => {
      alert("Relatório enviado por e-mail para a diretoria!");
      setProcessingAction(false);
    }, 1000);
  };

  const recarregar = async () => {
    setProcessingAction(true);
    try {
      await refetch();
    } finally {
      setProcessingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 text-center">
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Carregando relatórios financeiros...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 text-center space-y-4">
        <p className="text-gray-700">
          Não foi possível carregar os relatórios financeiros.
        </p>
        {error instanceof Error && (
          <p className="text-sm text-gray-500">{error.message}</p>
        )}
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  // =========================
  // 🔹 COMPONENTE
  // =========================

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-green-600" />
          Relatórios Financeiros
        </h2>

        <div className="flex gap-2">
          <button
            onClick={recarregar}
            className="p-2 rounded-lg border hover:bg-gray-100"
          >
            <RefreshCcw className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={enviarEmail}
            className="p-2 rounded-lg border hover:bg-gray-100"
          >
            <Mail className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex items-center border px-3 py-2 rounded-lg gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            className="text-sm outline-none"
            value={filtro.periodo}
            onChange={(e) => setFiltro({ ...filtro, periodo: e.target.value })}
          >
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
            <option value="90dias">Últimos 90 dias</option>
            <option value="ano">Ano atual</option>
          </select>
        </div>

        <div className="flex items-center border px-3 py-2 rounded-lg gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            className="text-sm outline-none"
            value={filtro.tipo}
            onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}
          >
            <option value="todos">Todos</option>
            <option value="pagar">Contas a Pagar</option>
            <option value="receber">Contas a Receber</option>
          </select>
        </div>
      </div>

      {/* Opções */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {opcoes.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => setRelatorio(opt.id)}
              className={`p-4 border rounded-xl flex items-center justify-center space-x-2 transition-all ${
                relatorio === opt.id
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${relatorio === opt.id ? "text-green-700" : "text-gray-500"}`}
              />
              <span className="font-medium text-sm">{opt.nome}</span>
            </button>
          );
        })}
      </div>

      {/* Painel Principal */}
      <div className="border-t pt-6">
        {processingAction ? (
          <div className="py-8 text-center text-gray-500">
            Processando informações...
          </div>
        ) : (
          <>
            {relatorio === "analitico" && (
              <Analitico
                dadosMensais={dadosMensais}
                distribuicaoCategorias={distribuicaoCategorias}
                tendencia={tendencia}
                exportar={exportar}
                cores={cores}
              />
            )}
            {relatorio === "balanco" && (
              <Balanco
                dadosMensais={dadosMensais}
                totais={totais}
                exportar={exportar}
              />
            )}
            {relatorio === "sintetico" && (
              <Sintetico
                totais={totais}
                distribuicaoCategorias={distribuicaoCategorias}
                exportar={exportar}
                cores={cores}
              />
            )}
            {relatorio === "recibo" && (
              <Recibo recibos={recibos} exportar={exportar} />
            )}
            {relatorio === "comissao" && (
              <Comissao
                comissoesVendedores={comissoesVendedores}
                exportar={exportar}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

type DadosMensais = { mes: string; entradas: number; saidas: number };
type DistribuicaoItem = { nome: string; valor: number };
type TotaisResumo = {
  entradas: number;
  saidas: number;
  lucro: number;
  margem: number;
};
type ComissaoResumo = { nome: string; vendas: number; comissao: number };
type ReciboResumo = { tipo: string; total: number };
type TendenciaInfo = { texto: string; icone: React.ReactNode };

interface AnaliticoProps {
  dadosMensais: DadosMensais[];
  distribuicaoCategorias: DistribuicaoItem[];
  tendencia: TendenciaInfo;
  exportar: (tipo: "pdf" | "excel") => void;
  cores: string[];
}

interface BalancoProps {
  dadosMensais: DadosMensais[];
  totais: TotaisResumo;
  exportar: (tipo: "pdf" | "excel") => void;
}

interface SinteticoProps {
  totais: TotaisResumo;
  distribuicaoCategorias: DistribuicaoItem[];
  exportar: (tipo: "pdf" | "excel") => void;
  cores: string[];
}

interface ReciboProps {
  recibos: ReciboResumo[];
  exportar: (tipo: "pdf" | "excel") => void;
}

interface ComissaoProps {
  comissoesVendedores: ComissaoResumo[];
  exportar: (tipo: "pdf" | "excel") => void;
}

const Analitico: React.FC<AnaliticoProps> = ({
  dadosMensais,
  distribuicaoCategorias,
  tendencia,
  exportar,
  cores,
}) => (
  <div>
    <h3 className="font-semibold mb-3 text-gray-700">Relatório Analítico</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosMensais}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="entradas"
              stroke="#16a34a"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="saidas"
              stroke="#dc2626"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distribuicaoCategorias}
              dataKey="valor"
              nameKey="nome"
              outerRadius={100}
              label
            >
              {distribuicaoCategorias.map((_, i) => (
                <Cell key={i} fill={cores[i % cores.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
    <p className="mt-4 text-sm text-gray-700 flex items-center gap-2">
      {tendencia.icone} {tendencia.texto}
    </p>
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => exportar("pdf")}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Download className="w-4 h-4" /> Exportar PDF
      </button>
      <button
        onClick={() => exportar("excel")}
        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
      >
        <Download className="w-4 h-4" /> Exportar Excel
      </button>
    </div>
  </div>
);

const Balanco: React.FC<BalancoProps> = ({
  dadosMensais,
  totais,
  exportar,
}) => (
  <div>
    <h3 className="font-semibold mb-3 text-gray-700">
      Balanço Financeiro Consolidado
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={dadosMensais}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="entradas" fill="#16a34a" />
        <Bar dataKey="saidas" fill="#dc2626" />
      </BarChart>
    </ResponsiveContainer>
    <p className="mt-3 text-gray-700">
      Lucro Total: <strong>R$ {totais.lucro.toLocaleString("pt-BR")}</strong> (
      {totais.margem}% de margem)
    </p>
    <button
      onClick={() => exportar("pdf")}
      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
    >
      <Download className="w-4 h-4" /> Exportar PDF
    </button>
  </div>
);

const Sintetico: React.FC<SinteticoProps> = ({
  totais,
  distribuicaoCategorias,
  exportar,
  cores,
}) => (
  <div>
    <h3 className="font-semibold mb-3 text-gray-700">Relatório Sintético</h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={distribuicaoCategorias}
          dataKey="valor"
          nameKey="nome"
          label
          outerRadius={120}
        >
          {distribuicaoCategorias.map((_, i) => (
            <Cell key={i} fill={cores[i % cores.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
    <p className="mt-3 text-gray-700">
      Total Receitas:{" "}
      <strong>R$ {totais.entradas.toLocaleString("pt-BR")}</strong> | Total
      Despesas: <strong>R$ {totais.saidas.toLocaleString("pt-BR")}</strong>
    </p>
    <button
      onClick={() => exportar("excel")}
      className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
    >
      <Download className="w-4 h-4" /> Exportar Excel
    </button>
  </div>
);

const Recibo: React.FC<ReciboProps> = ({ recibos, exportar }) => {
  const totalRecibos = recibos.reduce((acc, item) => acc + item.total, 0);
  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-700">Relatório de Recibos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={recibos}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tipo" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#0ea5e9" />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-3 text-gray-700">
        Total de recibos emitidos: <strong>{totalRecibos}</strong>
      </p>
      <button
        onClick={() => exportar("pdf")}
        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Download className="w-4 h-4" /> Exportar PDF
      </button>
    </div>
  );
};

const Comissao: React.FC<ComissaoProps> = ({
  comissoesVendedores,
  exportar,
}) => {
  const totalComissao = comissoesVendedores.reduce(
    (acc, item) => acc + item.comissao,
    0,
  );
  const media =
    comissoesVendedores.length > 0
      ? totalComissao / comissoesVendedores.length
      : 0;
  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-700">
        Relatório de Comissão
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={comissoesVendedores}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nome" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="vendas" fill="#16a34a" />
          <Bar dataKey="comissao" fill="#f97316" />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-3 text-gray-700">
        Comissão média: <strong>R$ {media.toFixed(2)}</strong>
      </p>
      <button
        onClick={() => exportar("excel")}
        className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
      >
        <Download className="w-4 h-4" /> Exportar Excel
      </button>
    </div>
  );
};

export default RelatoriosFinanceiro;
