"use client";
import React, { useEffect, useState } from "react";
import {
  Building2,
  Layers,
  CreditCard,
  Wallet,
  PlusCircle,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

type Banco = {
  id: number;
  nome: string;
  agencia: string;
  conta: string;
  saldo: number;
};
type TipoContabil = {
  id: number;
  descricao: string;
  natureza: "Despesa" | "Receita";
};
type FormaPagamento = { id: number; nome: string; prazo: string };
type CentroResultado = { id: number; nome: string; orcamento: number };

// União tipada dos formulários
type FormType =
  | Partial<Banco>
  | Partial<TipoContabil>
  | Partial<FormaPagamento>
  | Partial<CentroResultado>;

const CadastroFinanceiro = () => {
  const [abaAtiva, setAbaAtiva] = useState<
    "banco" | "tipo" | "forma" | "centro"
  >("banco");
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [tipos, setTipos] = useState<TipoContabil[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [centros, setCentros] = useState<CentroResultado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [form, setForm] = useState<FormType>({});

  // Simula carregamento de dados
  useEffect(() => {
    setTimeout(() => {
      setBancos([
        {
          id: 1,
          nome: "Banco do Brasil",
          agencia: "001",
          conta: "12345-6",
          saldo: 120000,
        },
        { id: 2, nome: "Itaú", agencia: "3456", conta: "9988-0", saldo: 54000 },
      ]);
      setTipos([
        { id: 1, descricao: "Receita de Vendas", natureza: "Receita" },
        { id: 2, descricao: "Despesas Administrativas", natureza: "Despesa" },
      ]);
      setFormas([
        { id: 1, nome: "Cartão de Crédito", prazo: "30 dias" },
        { id: 2, nome: "Boleto", prazo: "5 dias" },
      ]);
      setCentros([
        { id: 1, nome: "Operacional", orcamento: 250000 },
        { id: 2, nome: "Marketing", orcamento: 80000 },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const excluirItem = <T extends { id: number }>(
    id: number,
    setState: React.Dispatch<React.SetStateAction<T[]>>,
  ) => setState((prev) => prev.filter((i) => i.id !== id));

  const handleAdd = () => {
    switch (abaAtiva) {
      case "banco":
        setBancos((prev) => [
          ...prev,
          {
            id: Date.now(),
            ...form,
            saldo: Number((form as Partial<Banco>).saldo) || 0,
          } as Banco,
        ]);
        break;
      case "tipo":
        setTipos((prev) => [
          ...prev,
          { id: Date.now(), ...form } as TipoContabil,
        ]);
        break;
      case "forma":
        setFormas((prev) => [
          ...prev,
          { id: Date.now(), ...form } as FormaPagamento,
        ]);
        break;
      case "centro":
        setCentros((prev) => [
          ...prev,
          {
            id: Date.now(),
            ...form,
            orcamento:
              Number((form as Partial<CentroResultado>).orcamento) || 0,
          } as CentroResultado,
        ]);
        break;
    }
    setForm({});
    setShowModal(false);
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Cadastros Financeiros Corporativos
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        {[
          { id: "banco", nome: "Bancos", icon: Building2 },
          { id: "tipo", nome: "Tipos Contábeis", icon: Layers },
          { id: "forma", nome: "Formas de Pagamento", icon: CreditCard },
          { id: "centro", nome: "Centros de Resultado", icon: Wallet },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() =>
                setAbaAtiva(tab.id as "banco" | "tipo" | "forma" | "centro")
              }
              className={`flex items-center space-x-2 py-2 px-3 border-b-2 ${
                abaAtiva === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.nome}</span>
            </button>
          );
        })}
      </div>

      {/* Tabelas */}
      <div>
        {abaAtiva === "banco" && (
          <TabelaBanco
            bancos={bancos}
            excluir={(id) => excluirItem(id, setBancos)}
          />
        )}
        {abaAtiva === "tipo" && (
          <TabelaTipo
            tipos={tipos}
            excluir={(id) => excluirItem(id, setTipos)}
          />
        )}
        {abaAtiva === "forma" && (
          <TabelaForma
            formas={formas}
            excluir={(id) => excluirItem(id, setFormas)}
          />
        )}
        {abaAtiva === "centro" && (
          <TabelaCentro
            centros={centros}
            excluir={(id) => excluirItem(id, setCentros)}
          />
        )}
      </div>

      {/* Modal de cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-[400px] p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Novo {abaAtiva.charAt(0).toUpperCase() + abaAtiva.slice(1)}
            </h3>

            {/* Campos dinâmicos */}
            <div className="space-y-3">
              {abaAtiva === "banco" && (
                <>
                  <input
                    placeholder="Nome do Banco"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                  <input
                    placeholder="Agência"
                    className="w-full border p-2 rounded"
                    onChange={(e) =>
                      setForm({ ...form, agencia: e.target.value })
                    }
                  />
                  <input
                    placeholder="Conta"
                    className="w-full border p-2 rounded"
                    onChange={(e) =>
                      setForm({ ...form, conta: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Saldo Inicial"
                    className="w-full border p-2 rounded"
                    onChange={(e) =>
                      setForm({ ...form, saldo: Number(e.target.value) })
                    }
                  />
                </>
              )}

              {abaAtiva === "tipo" && (
                <>
                  <input
                    placeholder="Descrição"
                    className="w-full border p-2 rounded"
                    onChange={(e) =>
                      setForm({ ...form, descricao: e.target.value })
                    }
                  />
                  <select
                    className="w-full border p-2 rounded"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        natureza: e.target.value as "Despesa" | "Receita",
                      })
                    }
                  >
                    <option>Selecione a natureza</option>
                    <option value="Receita">Receita</option>
                    <option value="Despesa">Despesa</option>
                  </select>
                </>
              )}

              {abaAtiva === "forma" && (
                <>
                  <input
                    placeholder="Forma de Pagamento"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                  <input
                    placeholder="Prazo (ex: 30 dias)"
                    className="w-full border p-2 rounded"
                    onChange={(e) =>
                      setForm({ ...form, prazo: e.target.value })
                    }
                  />
                </>
              )}

              {abaAtiva === "centro" && (
                <>
                  <input
                    placeholder="Nome do Centro"
                    className="w-full border p-2 rounded"
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Orçamento"
                    className="w-full border p-2 rounded"
                    onChange={(e) =>
                      setForm({ ...form, orcamento: Number(e.target.value) })
                    }
                  />
                </>
              )}
            </div>

            <button
              onClick={handleAdd}
              className="w-full mt-5 bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Tabelas Separadas (componentes pequenos e limpos) ----------

const TabelaBanco = ({
  bancos,
  excluir,
}: {
  bancos: Banco[];
  excluir: (id: number) => void;
}) => (
  <table className="w-full text-sm border">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 border">Banco</th>
        <th className="p-2 border">Agência</th>
        <th className="p-2 border">Conta</th>
        <th className="p-2 border text-right">Saldo</th>
        <th className="p-2 border text-center">Ações</th>
      </tr>
    </thead>
    <tbody>
      {bancos.map((b) => (
        <tr key={b.id} className="border-t hover:bg-gray-50">
          <td className="p-2 border">{b.nome}</td>
          <td className="p-2 border">{b.agencia}</td>
          <td className="p-2 border">{b.conta}</td>
          <td className="p-2 border text-right text-green-700 font-medium">
            R$ {b.saldo.toLocaleString("pt-BR")}
          </td>
          <td className="p-2 border text-center">
            <button
              onClick={() => excluir(b.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 inline" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const TabelaTipo = ({
  tipos,
  excluir,
}: {
  tipos: TipoContabil[];
  excluir: (id: number) => void;
}) => (
  <table className="w-full text-sm border">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 border">Descrição</th>
        <th className="p-2 border text-center">Natureza</th>
        <th className="p-2 border text-center">Ações</th>
      </tr>
    </thead>
    <tbody>
      {tipos.map((t) => (
        <tr key={t.id} className="border-t hover:bg-gray-50">
          <td className="p-2 border">{t.descricao}</td>
          <td
            className={`p-2 border text-center font-medium ${t.natureza === "Receita" ? "text-green-600" : "text-red-600"}`}
          >
            {t.natureza}
          </td>
          <td className="p-2 border text-center">
            <button
              onClick={() => excluir(t.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 inline" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const TabelaForma = ({
  formas,
  excluir,
}: {
  formas: FormaPagamento[];
  excluir: (id: number) => void;
}) => (
  <table className="w-full text-sm border">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 border">Forma</th>
        <th className="p-2 border">Prazo</th>
        <th className="p-2 border text-center">Ações</th>
      </tr>
    </thead>
    <tbody>
      {formas.map((f) => (
        <tr key={f.id} className="border-t hover:bg-gray-50">
          <td className="p-2 border">{f.nome}</td>
          <td className="p-2 border">{f.prazo}</td>
          <td className="p-2 border text-center">
            <button
              onClick={() => excluir(f.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 inline" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const TabelaCentro = ({
  centros,
  excluir,
}: {
  centros: CentroResultado[];
  excluir: (id: number) => void;
}) => (
  <table className="w-full text-sm border">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 border">Centro</th>
        <th className="p-2 border text-right">Orçamento</th>
        <th className="p-2 border text-center">Ações</th>
      </tr>
    </thead>
    <tbody>
      {centros.map((c) => (
        <tr key={c.id} className="border-t hover:bg-gray-50">
          <td className="p-2 border">{c.nome}</td>
          <td className="p-2 border text-right">
            R$ {c.orcamento.toLocaleString("pt-BR")}
          </td>
          <td className="p-2 border text-center">
            <button
              onClick={() => excluir(c.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 inline" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default CadastroFinanceiro;
