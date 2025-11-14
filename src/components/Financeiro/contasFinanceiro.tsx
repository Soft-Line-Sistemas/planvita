"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  PlusCircle,
} from "lucide-react";
import {
  ContaFinanceira,
  StatusFinanceiro,
  TipoConta,
  getDiasAtraso,
} from "@/types/Financeiro";
import { useContasFinanceiras } from "@/hooks/queries/useContasFinanceiras";
import {
  useBaixarContaFinanceira,
  useEstornarContaFinanceira,
  useCriarContaFinanceira,
} from "@/hooks/mutations/useContaFinanceiraMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinanceiroClientes } from "@/hooks/queries/useFinanceiroClientes";
import type { ClienteFinanceiroResumo } from "@/services/financeiro/clientes.service";

type FiltroStatus =
  | "todas"
  | "pagas"
  | "pendentes"
  | "atrasadas"
  | "canceladas";

const statusConfig: Record<
  StatusFinanceiro,
  { icon: React.ElementType; color: string; bg: string }
> = {
  PENDENTE: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  ATRASADO: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  PAGO: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  RECEBIDO: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  CANCELADO: { icon: AlertTriangle, color: "text-gray-600", bg: "bg-gray-100" },
};

const ContasFinanceiro: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useContasFinanceiras();
  const contas = useMemo(() => data ?? [], [data]);
  const baixarConta = useBaixarContaFinanceira();
  const estornarConta = useEstornarContaFinanceira();
  const criarConta = useCriarContaFinanceira();

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");
  const [filtroTipo, setFiltroTipo] = useState<TipoConta | "todas">("todas");
  const [mostrarModalNovaConta, setMostrarModalNovaConta] = useState(false);
  const [tipoContaNova, setTipoContaNova] = useState<TipoConta>("Pagar");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [erroNovaConta, setErroNovaConta] = useState<string | null>(null);
  const [formNovaConta, setFormNovaConta] = useState({
    descricao: "",
    valor: "",
    vencimento: "",
    fornecedor: "",
    clienteId: "",
    clienteNome: "",
  });

  const { data: clientesDisponiveis = [], isLoading: carregandoClientes } =
    useFinanceiroClientes(
      buscaCliente,
      mostrarModalNovaConta && tipoContaNova === "Receber",
    );

  const resumo = useMemo(() => {
    const totalPagar = contas
      .filter((c) => c.tipo === "Pagar")
      .reduce((acc, c) => acc + c.valor, 0);
    const totalReceber = contas
      .filter((c) => c.tipo === "Receber")
      .reduce((acc, c) => acc + c.valor, 0);

    return {
      pagar: totalPagar,
      receber: totalReceber,
      saldo: totalReceber - totalPagar,
    };
  }, [contas]);

  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => {
      const matchTipo =
        filtroTipo === "todas" ? true : conta.tipo === filtroTipo;

      if (!matchTipo) return false;

      switch (filtroStatus) {
        case "pagas":
          return conta.status === "PAGO" || conta.status === "RECEBIDO";
        case "pendentes":
          return conta.status === "PENDENTE";
        case "atrasadas":
          return conta.status === "ATRASADO";
        case "canceladas":
          return conta.status === "CANCELADO";
        default:
          return true;
      }
    });
  }, [contas, filtroStatus, filtroTipo]);

  const podeBaixar = (conta: ContaFinanceira) =>
    conta.status === "PENDENTE" || conta.status === "ATRASADO";

  const podeEstornar = (conta: ContaFinanceira) =>
    conta.status === "PAGO" || conta.status === "RECEBIDO";

  const handleBaixa = (conta: ContaFinanceira) => {
    baixarConta.mutate({
      tipo: conta.tipo,
      id: conta.id,
    });
  };

  const handleEstorno = (conta: ContaFinanceira) => {
    estornarConta.mutate({
      tipo: conta.tipo,
      id: conta.id,
    });
  };

  const resetModal = () => {
    setMostrarModalNovaConta(false);
    setErroNovaConta(null);
    setBuscaCliente("");
    setFormNovaConta({
      descricao: "",
      valor: "",
      vencimento: "",
      fornecedor: "",
      clienteId: "",
      clienteNome: "",
    });
  };

  const handleCriarConta = () => {
    setErroNovaConta(null);
    const valorNumerico = Number(formNovaConta.valor);
    if (
      !formNovaConta.descricao.trim() ||
      !formNovaConta.valor ||
      !formNovaConta.vencimento ||
      Number.isNaN(valorNumerico) ||
      valorNumerico <= 0
    ) {
      if (valorNumerico <= 0 || Number.isNaN(valorNumerico)) {
        setErroNovaConta("Informe um valor positivo.");
      }
      return;
    }

    if (tipoContaNova === "Pagar") {
      criarConta.mutate(
        {
          tipo: "Pagar",
          payload: {
            descricao: formNovaConta.descricao.trim(),
            valor: valorNumerico,
            vencimento: formNovaConta.vencimento,
            fornecedor: formNovaConta.fornecedor.trim() || undefined,
          },
        },
        {
          onSuccess: resetModal,
        },
      );
    } else {
      const clienteId = formNovaConta.clienteId
        ? Number(formNovaConta.clienteId)
        : undefined;

      if (!clienteId) {
        setErroNovaConta("Selecione um cliente vinculado à conta.");
        return;
      }

      criarConta.mutate(
        {
          tipo: "Receber",
          payload: {
            descricao: formNovaConta.descricao.trim(),
            valor: valorNumerico,
            vencimento: formNovaConta.vencimento,
            clienteId,
          },
        },
        {
          onSuccess: resetModal,
        },
      );
    }
  };

  const isProcessing = (conta: ContaFinanceira) => {
    const targetId = conta.id.toString();
    if (
      baixarConta.isPending &&
      baixarConta.variables &&
      baixarConta.variables.id.toString() === targetId
    ) {
      return true;
    }

    if (
      estornarConta.isPending &&
      estornarConta.variables &&
      estornarConta.variables.id.toString() === targetId
    ) {
      return true;
    }

    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Carregando informações financeiras...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold mb-2">
          Não foi possível carregar as contas financeiras.
        </p>
        {error instanceof Error && (
          <p className="text-sm text-red-600 mb-4">{error.message}</p>
        )}
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 rounded-2xl border border-gray-200">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" />
            Contas Financeiras
          </h2>

          <div className="flex flex-wrap justify-end gap-2">
            {(
              [
                "todas",
                "pagas",
                "pendentes",
                "atrasadas",
                "canceladas",
              ] as const
            ).map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                  filtroStatus === status
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
            <Button
              onClick={() => {
                setErroNovaConta(null);
                setBuscaCliente("");
                setMostrarModalNovaConta(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Nova conta
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Contas a pagar</p>
                <p className="text-xl font-semibold text-gray-900">
                  R$ {resumo.pagar.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Contas a receber</p>
                <p className="text-xl font-semibold text-gray-900">
                  R$ {resumo.receber.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo projetado</p>
                <p
                  className={`text-xl font-semibold ${
                    resumo.saldo >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  R$ {resumo.saldo.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro tipo */}
        <div className="flex flex-wrap gap-3">
          {(["todas", "Pagar", "Receber"] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() =>
                setFiltroTipo(tipo === "todas" ? "todas" : (tipo as TipoConta))
              }
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                filtroTipo === tipo
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
              }`}
            >
              {tipo === "todas" ? "Todas as contas" : `Contas a ${tipo}`}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Parceiro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {contasFiltradas.map((conta) => {
                  const meta = statusConfig[conta.status];
                  const Icon = meta.icon;
                  const diasAtraso = getDiasAtraso(conta);
                  const atrasada =
                    diasAtraso > 0 &&
                    (conta.status === "PENDENTE" ||
                      conta.status === "ATRASADO");

                  return (
                    <tr
                      key={`${conta.tipo}-${conta.id}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {conta.tipo === "Pagar" ? (
                          <span className="text-red-600">Pagar</span>
                        ) : (
                          <span className="text-green-600">Receber</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="font-semibold">{conta.descricao}</p>
                        {conta.observacao && (
                          <p className="text-xs text-gray-500">
                            {conta.observacao}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p className="font-medium">{conta.parceiro}</p>
                        {conta.contato && (
                          <p className="text-xs text-gray-500">
                            {conta.contato}
                          </p>
                        )}
                        {conta.cliente?.cpf && (
                          <p className="text-xs text-gray-500">
                            CPF: {conta.cliente.cpf}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p className="font-medium">
                          {new Date(conta.dataVencimento).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                        {atrasada && (
                          <p className="text-xs text-red-600 font-medium">
                            {diasAtraso} dias em atraso
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        R$ {conta.valor.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}
                        >
                          <Icon className="w-4 h-4" />
                          {conta.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {podeBaixar(conta) && (
                            <button
                              onClick={() => handleBaixa(conta)}
                              disabled={isProcessing(conta)}
                              className="px-3 py-1 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {isProcessing(conta) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Baixar
                            </button>
                          )}

                          {podeEstornar(conta) && (
                            <button
                              onClick={() => handleEstorno(conta)}
                              disabled={isProcessing(conta)}
                              className="px-3 py-1 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {isProcessing(conta) ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              Estornar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {contasFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      Nenhuma conta encontrada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {mostrarModalNovaConta && (
        <ModalNovaConta
          tipo={tipoContaNova}
          setTipo={setTipoContaNova}
          form={formNovaConta}
          setForm={setFormNovaConta}
          onClose={resetModal}
          onSubmit={handleCriarConta}
          isSubmitting={criarConta.isPending}
          clientes={clientesDisponiveis}
          isLoadingClientes={carregandoClientes}
          buscaCliente={buscaCliente}
          onChangeBuscaCliente={setBuscaCliente}
          erro={erroNovaConta}
          onClearErro={() => setErroNovaConta(null)}
        />
      )}
    </div>
  );
};

const ModalNovaConta = ({
  tipo,
  setTipo,
  form,
  setForm,
  onClose,
  onSubmit,
  isSubmitting,
  clientes,
  isLoadingClientes,
  buscaCliente,
  onChangeBuscaCliente,
  erro,
  onClearErro,
}: {
  tipo: TipoConta;
  setTipo: (tipo: TipoConta) => void;
  form: {
    descricao: string;
    valor: string;
    vencimento: string;
    fornecedor: string;
    clienteId: string;
    clienteNome: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      descricao: string;
      valor: string;
      vencimento: string;
      fornecedor: string;
      clienteId: string;
      clienteNome: string;
    }>
  >;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  clientes: ClienteFinanceiroResumo[];
  isLoadingClientes: boolean;
  buscaCliente: string;
  onChangeBuscaCliente: (valor: string) => void;
  erro: string | null;
  onClearErro: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Nova conta financeira
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Tipo</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              value={tipo}
              onChange={(event) => {
                const novoTipo = event.target.value as TipoConta;
                setTipo(novoTipo);
                onClearErro();
                setForm((prev) => ({
                  ...prev,
                  ...(novoTipo === "Pagar"
                    ? { clienteId: "", clienteNome: "" }
                    : { fornecedor: "" }),
                }));
              }}
            >
              <option value="Pagar">Conta a pagar</option>
              <option value="Receber">Conta a receber</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Descrição</label>
            <Input
              value={form.descricao}
              onChange={(event) => {
                onClearErro();
                setForm((prev) => ({ ...prev, descricao: event.target.value }));
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Valor</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(event) => {
                  onClearErro();
                  setForm((prev) => ({ ...prev, valor: event.target.value }));
                }}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Vencimento</label>
              <Input
                type="date"
                value={form.vencimento}
                onChange={(event) => {
                  onClearErro();
                  setForm((prev) => ({
                    ...prev,
                    vencimento: event.target.value,
                  }));
                }}
              />
            </div>
          </div>

          {tipo === "Pagar" ? (
            <div>
              <label className="text-sm text-gray-600">
                Fornecedor (opcional)
              </label>
              <Input
                value={form.fornecedor}
                onChange={(event) => {
                  onClearErro();
                  setForm((prev) => ({
                    ...prev,
                    fornecedor: event.target.value,
                  }));
                }}
                placeholder="Fornecedor responsável pelo pagamento"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600">
                  Cliente vinculado
                </label>
                <Input
                  value={buscaCliente}
                  onChange={(event) => {
                    onChangeBuscaCliente(event.target.value);
                    onClearErro();
                  }}
                  placeholder="Buscar por nome, e-mail ou CPF"
                />
              </div>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.clienteId}
                onChange={(event) => {
                  const selectedValue = event.target.value;
                  const cliente = clientes.find(
                    (item) => String(item.id) === selectedValue,
                  );
                  onClearErro();
                  setForm((prev) => ({
                    ...prev,
                    clienteId: selectedValue,
                    clienteNome: cliente?.nome ?? prev.clienteNome,
                  }));
                }}
              >
                <option value="">Selecione um cliente</option>
                {isLoadingClientes && (
                  <option value="" disabled>
                    Carregando clientes...
                  </option>
                )}
                {!isLoadingClientes &&
                  clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} • {cliente.cpf || "CPF não informado"}
                    </option>
                  ))}
              </select>
              {form.clienteNome && (
                <p className="text-xs text-gray-500">
                  Cliente selecionado: {form.clienteNome}
                </p>
              )}
            </div>
          )}
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContasFinanceiro;
