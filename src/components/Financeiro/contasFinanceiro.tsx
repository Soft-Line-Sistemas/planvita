"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  ContaFinanceira,
  StatusContaPagar,
  StatusContaReceber,
  BaixaFinanceira,
  EstornoFinanceiro,
} from "@/types/Financeiro";

const ContasFinanceiro: React.FC = () => {
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<
    "todas" | "pagas" | "pendentes" | "atrasadas" | "canceladas"
  >("todas");

  // ---------------- Mock de dados empresariais ----------------
  useEffect(() => {
    setTimeout(() => {
      const mockData: ContaFinanceira[] = [
        {
          tipo: "Pagar",
          id_conta_pagar: 1,
          fornecedor_id: 101,
          data_emissao: "2025-11-01",
          data_vencimento: "2025-11-10",
          valor_original: 3800,
          juros: 0,
          multa: 0,
          desconto: 0,
          status: "PENDENTE",
          forma_pagamento: "PIX",
          categoria_id: 10,
          observacao: "Pagamento fornecedor de insumos",
        },
        {
          tipo: "Receber",
          id_conta_receber: 2,
          cliente_id: 501,
          data_emissao: "2025-11-03",
          data_vencimento: "2025-11-08",
          valor_original: 5200,
          juros_recebido: 0,
          desconto_concedido: 0,
          status: "RECEBIDO",
          forma_recebimento: "Transferência",
          categoria_id: 20,
          observacao: "Recebimento de contrato mensal",
          baixa: {
            data_baixa: "2025-11-08",
            usuario_id: 7,
            conta_bancaria_id: 1,
            valor_baixado: 5200,
          },
        },
        {
          tipo: "Pagar",
          id_conta_pagar: 3,
          fornecedor_id: 104,
          data_emissao: "2025-10-20",
          data_vencimento: "2025-10-30",
          valor_original: 2600,
          juros: 120,
          multa: 60,
          desconto: 0,
          status: "ATRASADO",
          forma_pagamento: "Boleto",
          categoria_id: 11,
          observacao: "Despesa de manutenção",
        },
      ];
      setContas(mockData);
      setLoading(false);
    }, 800);
  }, []);

  // ---------------- Funções de ação ----------------

  /** Marca uma conta como baixada (PAGO ou RECEBIDO) */
  const realizarBaixa = (id: number) => {
    setContas((prev): ContaFinanceira[] =>
      prev.map((c) => {
        if (
          c.tipo === "Pagar" &&
          "id_conta_pagar" in c &&
          c.id_conta_pagar === id
        ) {
          return {
            ...c,
            status: "PAGO" as StatusContaPagar,
            baixa: {
              data_baixa: new Date().toISOString().split("T")[0],
              usuario_id: 999,
              conta_bancaria_id: 1,
              valor_baixado: c.valor_original,
              observacao: "Baixa manual via sistema",
            },
          };
        }
        if (
          c.tipo === "Receber" &&
          "id_conta_receber" in c &&
          c.id_conta_receber === id
        ) {
          return {
            ...c,
            status: "RECEBIDO" as StatusContaReceber,
            baixa: {
              data_baixa: new Date().toISOString().split("T")[0],
              usuario_id: 999,
              conta_bancaria_id: 1,
              valor_baixado: c.valor_original,
              observacao: "Baixa manual via sistema",
            },
          };
        }
        return c;
      }),
    );
  };

  /** Estorna uma conta já baixada (volta para PENDENTE) */
  const estornarConta = (id: number) => {
    setContas((prev): ContaFinanceira[] =>
      prev.map((c) => {
        if (
          (c.tipo === "Pagar" &&
            "id_conta_pagar" in c &&
            c.id_conta_pagar === id) ||
          (c.tipo === "Receber" &&
            "id_conta_receber" in c &&
            c.id_conta_receber === id)
        ) {
          return {
            ...c,
            status: "PENDENTE",
            estorno: {
              data_estorno: new Date().toISOString().split("T")[0],
              usuario_id: 999,
              motivo: "Erro operacional",
              valor_estornado: c.valor_original,
            },
          };
        }
        return c;
      }),
    );
  };

  // ---------------- Filtro e totais ----------------
  const contasFiltradas = useMemo(() => {
    if (filtro === "todas") return contas;
    if (filtro === "pagas")
      return contas.filter(
        (c) => c.status === "PAGO" || c.status === "RECEBIDO",
      );
    if (filtro === "pendentes")
      return contas.filter((c) => c.status === "PENDENTE");
    if (filtro === "atrasadas")
      return contas.filter((c) => c.status === "ATRASADO");
    if (filtro === "canceladas")
      return contas.filter((c) => c.status === "CANCELADO");
    return contas;
  }, [filtro, contas]);

  const totalPagar = contas
    .filter((c) => c.tipo === "Pagar")
    .reduce((acc, c) => acc + c.valor_original, 0);

  const totalReceber = contas
    .filter((c) => c.tipo === "Receber")
    .reduce((acc, c) => acc + c.valor_original, 0);

  const saldoLiquido = totalReceber - totalPagar;

  // ---------------- Component ----------------
  if (loading)
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        Carregando informações financeiras...
      </div>
    );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* ---------- Cabeçalho ---------- */}
      <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-indigo-600" />
        Controle Financeiro Corporativo
      </h1>

      {/* ---------- Resumo ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-gray-600">
            <ArrowDownCircle className="w-5 h-5 text-red-600" />
            <span>Contas a Pagar</span>
          </div>
          <p className="text-xl font-semibold text-red-700">
            R$ {totalPagar.toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-gray-600">
            <ArrowUpCircle className="w-5 h-5 text-green-600" />
            <span>Contas a Receber</span>
          </div>
          <p className="text-xl font-semibold text-green-700">
            R$ {totalReceber.toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-gray-600">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <span>Saldo Líquido</span>
          </div>
          <p
            className={`text-xl font-semibold ${
              saldoLiquido >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            R$ {saldoLiquido.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* ---------- Filtro ---------- */}
      <div className="flex flex-wrap gap-3 mb-6">
        {["todas", "pagas", "pendentes", "atrasadas", "canceladas"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f as typeof filtro)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              filtro === f
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ---------- Tabela ---------- */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-600">
                Tipo
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">
                Emissão
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">
                Vencimento
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">
                Valor
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">
                Status
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {contasFiltradas.map((conta) => (
              <tr
                key={
                  conta.tipo === "Pagar"
                    ? `pagar-${conta.id_conta_pagar}`
                    : `receber-${conta.id_conta_receber}`
                }
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="p-3 text-sm">
                  {conta.tipo === "Pagar" ? (
                    <span className="text-red-600 font-medium">Pagar</span>
                  ) : (
                    <span className="text-green-600 font-medium">Receber</span>
                  )}
                </td>
                <td className="p-3 text-sm">{conta.data_emissao}</td>
                <td className="p-3 text-sm">{conta.data_vencimento}</td>
                <td className="p-3 text-sm">
                  R$ {conta.valor_original.toLocaleString("pt-BR")}
                </td>
                <td className="p-3 text-sm flex items-center gap-2">
                  {conta.status === "PENDENTE" && (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                  {["PAGO", "RECEBIDO"].includes(conta.status) && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {conta.status === "ATRASADO" && (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{conta.status}</span>
                </td>
                <td className="p-3 text-sm flex gap-2">
                  {conta.status === "PENDENTE" ? (
                    <button
                      onClick={() =>
                        conta.tipo === "Pagar"
                          ? realizarBaixa(conta.id_conta_pagar)
                          : realizarBaixa(conta.id_conta_receber)
                      }
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                    >
                      Baixar
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        conta.tipo === "Pagar"
                          ? estornarConta(conta.id_conta_pagar)
                          : estornarConta(conta.id_conta_receber)
                      }
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                    >
                      Estornar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContasFinanceiro;
