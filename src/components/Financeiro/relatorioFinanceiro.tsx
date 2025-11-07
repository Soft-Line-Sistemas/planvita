"use client";
import React, { useState } from "react";
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
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
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

const RelatoriosFinanceiro = () => {
  const [relatorio, setRelatorio] = useState("analitico");
  const [filtro, setFiltro] = useState({ periodo: "30dias", tipo: "todos" });
  const [loading, setLoading] = useState(false);

  // =========================
  // 🔹 MOCK DE DADOS
  // =========================
  const dadosMensais = [
    { mes: "Jan", entradas: 18000, saidas: 12500 },
    { mes: "Fev", entradas: 20500, saidas: 15700 },
    { mes: "Mar", entradas: 19200, saidas: 14800 },
    { mes: "Abr", entradas: 23100, saidas: 16500 },
    { mes: "Mai", entradas: 25800, saidas: 18400 },
    { mes: "Jun", entradas: 27400, saidas: 19100 },
  ];

  const distribuicaoCategorias = [
    { nome: "Vendas", valor: 42000 },
    { nome: "Serviços", valor: 18000 },
    { nome: "Investimentos", valor: 9800 },
    { nome: "Outros", valor: 4500 },
  ];

  const comissoesVendedores = [
    { nome: "Carlos", vendas: 12000, comissao: 1200 },
    { nome: "Mariana", vendas: 15800, comissao: 1580 },
    { nome: "Roberto", vendas: 9800, comissao: 980 },
    { nome: "Amanda", vendas: 20400, comissao: 2040 },
  ];

  const recibos = [
    { tipo: "Pagamentos", total: 187 },
    { tipo: "Recebimentos", total: 142 },
  ];

  const cores = ["#16a34a", "#0ea5e9", "#f97316", "#9333ea"];

  const totais = {
    entradas: 162000,
    saidas: 107000,
    lucro: 55000,
    margem: 33.9,
  };

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

  const exportar = (tipo: string) => {
    setLoading(true);
    setTimeout(() => {
      alert(`Exportando relatório em formato: ${tipo.toUpperCase()}`);
      setLoading(false);
    }, 800);
  };

  const enviarEmail = () => {
    setLoading(true);
    setTimeout(() => {
      alert("Relatório enviado por e-mail para a diretoria!");
      setLoading(false);
    }, 1000);
  };

  const recarregar = () => {
    setLoading(true);
    setTimeout(() => {
      alert("Dados atualizados com sucesso!");
      setLoading(false);
    }, 1000);
  };

  const tendencia =
    totais.entradas > totais.saidas
      ? {
          texto: "Lucro crescente",
          icone: <TrendingUp className="text-green-600 w-4 h-4 inline" />,
        }
      : {
          texto: "Atenção: prejuízo detectado",
          icone: <TrendingDown className="text-red-600 w-4 h-4 inline" />,
        };

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
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Processando informações...
          </div>
        ) : (
          <>
            {relatorio === "analitico" && (
              <Analitico
                dadosMensais={dadosMensais}
                totais={totais}
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

// =========================
// 🔹 Subcomponentes
// =========================

const Analitico = ({
  dadosMensais,
  totais,
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

const Balanco = ({ dadosMensais, totais, exportar }) => (
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

const Sintetico = ({ totais, distribuicaoCategorias, exportar, cores }) => (
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

const Recibo = ({ recibos, exportar }) => (
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
      Total de recibos emitidos:{" "}
      <strong>{recibos.reduce((a, b) => a + b.total, 0)}</strong>
    </p>
    <button
      onClick={() => exportar("pdf")}
      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
    >
      <Download className="w-4 h-4" /> Exportar PDF
    </button>
  </div>
);

const Comissao = ({ comissoesVendedores, exportar }) => (
  <div>
    <h3 className="font-semibold mb-3 text-gray-700">Relatório de Comissão</h3>
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
      Comissão média:{" "}
      <strong>
        R$
        {(
          comissoesVendedores.reduce((a, b) => a + b.comissao, 0) /
          comissoesVendedores.length
        ).toFixed(2)}
      </strong>
    </p>
    <button
      onClick={() => exportar("excel")}
      className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
    >
      <Download className="w-4 h-4" /> Exportar Excel
    </button>
  </div>
);

export default RelatoriosFinanceiro;
