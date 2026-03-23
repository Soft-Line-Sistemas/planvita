"use client";

import { useMemo } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { useRecorrenciasFinanceiras } from "@/hooks/queries/useRecorrenciasFinanceiras";
import {
  useGerarRecorrenciaTitular,
  useSincronizarRecorrenciasFinanceiras,
} from "@/hooks/mutations/useContaFinanceiraMutations";
import { Button } from "@/components/ui/button";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

export default function RecorrenciasFinanceiro() {
  const { data, isLoading, isError, error } = useRecorrenciasFinanceiras();
  const syncMutation = useSincronizarRecorrenciasFinanceiras();
  const gerarMutation = useGerarRecorrenciaTitular();

  const recorrencias = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Carregando recorrências...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold mb-2">
          Não foi possível carregar as recorrências.
        </p>
        {error instanceof Error && (
          <p className="text-sm text-red-600">{error.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Recorrências Asaas
          </h3>
          <p className="text-sm text-gray-500">
            Referências de assinatura sincronizadas com Contas Financeiras.
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2"
        >
          {syncMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCcw className="w-4 h-4" />
          )}
          Sincronizar agora
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                Subscription
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                Referência
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                Próx. vencimento
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                Última baixa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                Ação
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recorrencias.map((item) => (
              <tr key={item.titularId}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.clienteNome}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {item.asaasSubscriptionId || "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  <div className="space-y-1">
                    <p>{item.referenciaExterna}</p>
                    <p>
                      Local:{" "}
                      <span
                        className={
                          item.temReferenciaLocal
                            ? "text-green-700 font-medium"
                            : "text-amber-700 font-medium"
                        }
                      >
                        {item.temReferenciaLocal ? "OK" : "Pendente"}
                      </span>
                    </p>
                    <p>
                      Asaas:{" "}
                      <span
                        className={
                          item.temReferenciaAsaas
                            ? "text-green-700 font-medium"
                            : "text-amber-700 font-medium"
                        }
                      >
                        {item.temReferenciaAsaas ? "OK" : "Pendente"}
                      </span>
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.aberto
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.statusAtual}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatCurrency(item.valorAtual)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatDate(item.proximoVencimento)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatDate(item.ultimaLiquidacao)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Button
                    size="sm"
                    onClick={() => gerarMutation.mutate(item.titularId)}
                    disabled={
                      gerarMutation.isPending ||
                      item.temReferenciaAsaas ||
                      item.temReferenciaLocal
                    }
                  >
                    {gerarMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Gerar recorrência"
                    )}
                  </Button>
                </td>
              </tr>
            ))}
            {!recorrencias.length && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  Nenhuma recorrência encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
