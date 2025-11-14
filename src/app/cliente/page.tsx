"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCPF } from "@/helpers/formHelpers";
import type { ClientePlano } from "@/types/ClientePlano";
import { consultarClientePorCpf } from "@/services/clienteCarteirinha.service";
import CarteirinhaAsImage from "@/components/CarteirinhaAsImage";
import { useQuery } from "@tanstack/react-query";
import { listarContasDoCliente } from "@/services/financeiro/contasCliente.service";

const normalizeCpf = (value: string) => value.replace(/\D/g, "");

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

export default function ConsultaClientePage() {
  const [cpf, setCpf] = useState("");
  const [cliente, setCliente] = useState<ClientePlano | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<
    "carteirinha" | "plano" | "financeiro"
  >("carteirinha");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const digitsOnly = normalizeCpf(cpf);
    if (digitsOnly.length !== 11) {
      setError("Informe um CPF válido com 11 dígitos.");
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
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Erro inesperado ao buscar o plano.",
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

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-100 pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pt-16">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[#22c55e]">
            Planvita
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Consulte seu plano pelo CPF
          </h1>
          <p className="text-base text-slate-600 md:text-lg">
            Informe o CPF do titular para visualizar os detalhes completos do
            plano contratado.
          </p>
        </header>

        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4 md:flex-row md:items-end"
          >
            <div className="w-full">
              <label
                htmlFor="cpf"
                className="mb-2 block text-sm font-medium text-slate-700"
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
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "cpf-error" : undefined}
              />
              {error && (
                <p id="cpf-error" className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Consultando
                  </>
                ) : (
                  "Consultar"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RefreshCw className="size-4" />
                Limpar
              </Button>
            </div>
          </form>
        </section>

        <section className="flex flex-1 items-center justify-center w-full">
          {isLoading && (
            <div className="flex animate-pulse flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-10 py-12 text-slate-500 shadow-inner">
              <Loader2 className="size-10 animate-spin" />
              <p>Buscando informações do plano...</p>
            </div>
          )}

          {!isLoading && cliente && (
            <div className="w-full space-y-6">
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { id: "carteirinha", label: "Carteirinha" },
                  { id: "plano", label: "Detalhes do Plano" },
                  { id: "financeiro", label: "Financeiro" },
                ].map((aba) => (
                  <button
                    key={aba.id}
                    onClick={() => setAbaAtiva(aba.id as typeof abaAtiva)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      abaAtiva === aba.id
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {aba.label}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-emerald-700 mb-4">
                      Informações do Plano
                    </h3>
                    <dl className="space-y-3 text-sm text-gray-700">
                      <div>
                        <dt className="text-gray-500">Nome</dt>
                        <dd className="font-medium">{cliente.plano.nome}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Valor mensal</dt>
                        <dd className="font-medium">
                          {formatCurrency(cliente.plano.valorMensal)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Código</dt>
                        <dd className="font-medium">{cliente.plano.codigo}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Status</dt>
                        <dd
                          className={`font-medium ${
                            cliente.plano.status === "ativo"
                              ? "text-emerald-600"
                              : cliente.plano.status === "suspenso"
                                ? "text-amber-600"
                                : "text-rose-600"
                          }`}
                        >
                          {cliente.plano.status}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Vigência</dt>
                        <dd className="font-medium">
                          {formatDate(cliente.plano.vigencia.inicio)} até{" "}
                          {formatDate(cliente.plano.vigencia.fim)}
                        </dd>
                      </div>
                      {cliente.plano.observacoes && (
                        <div>
                          <dt className="text-gray-500">Observações</dt>
                          <dd>{cliente.plano.observacoes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-emerald-700 mb-4">
                      Coberturas Incluídas
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {cliente.plano.cobertura.map((item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                      {cliente.plano.cobertura.length === 0 && (
                        <li className="text-gray-500">
                          Nenhuma cobertura detalhada.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {abaAtiva === "financeiro" && (
                <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-700">
                        Lançamentos Financeiros
                      </h3>
                      <p className="text-sm text-gray-500">
                        Contas a receber vinculadas ao CPF informado.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => cliente?.titularId && refetchFinanceiro()}
                      disabled={isLoadingFinanceiro || !cliente?.titularId}
                    >
                      {isLoadingFinanceiro ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Atualizando
                        </>
                      ) : (
                        "Atualizar"
                      )}
                    </Button>
                  </div>

                  {isLoadingFinanceiro ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="size-4 animate-spin" />
                      Buscando lançamentos...
                    </div>
                  ) : contasFinanceiras.length > 0 ? (
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
                              <td className="px-4 py-2">{conta.descricao}</td>
                              <td className="px-4 py-2">
                                {formatDate(conta.vencimento)}
                              </td>
                              <td className="px-4 py-2 font-medium">
                                {formatCurrency(conta.valor)}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    conta.status === "RECEBIDO" ||
                                    conta.status === "PAGO"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : conta.status === "PENDENTE"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {conta.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nenhuma conta encontrada para este cliente.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!isLoading && !cliente && !error && (
            <div className="max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500 shadow-inner">
              <p className="text-sm">
                Faça a consulta acima para visualizar os dados do plano do
                titular.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
