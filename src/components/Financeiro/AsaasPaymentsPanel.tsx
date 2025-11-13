"use client";

import { useMemo, useState } from "react";
import { RefreshCcw, Search, CreditCard } from "lucide-react";
import { useAsaasPayments } from "@/hooks/queries/useAsaasPayments";
import { AsaasPaymentStatus } from "@/services/financeiro/asaas.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS: Array<AsaasPaymentStatus | "all"> = [
  "all",
  "PENDING",
  "RECEIVED",
  "CONFIRMED",
  "OVERDUE",
  "REFUNDED",
  "CANCELLED",
  "FAILED",
];

const statusBadge = (status: AsaasPaymentStatus) => {
  switch (status) {
    case "RECEIVED":
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "OVERDUE":
      return "bg-red-100 text-red-700";
    case "CANCELLED":
    case "FAILED":
      return "bg-gray-100 text-gray-600";
    case "REFUNDED":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

const normalizeSearch = (value: string) => value.toLowerCase();

export const AsaasPaymentsPanel = () => {
  const [statusFilter, setStatusFilter] = useState<AsaasPaymentStatus | "all">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAsaasPayments({
      status: statusFilter === "all" ? undefined : statusFilter,
    });

  const payments = useMemo(() => data ?? [], [data]);

  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    const term = normalizeSearch(searchTerm);
    return payments.filter((payment) => {
      const source = [
        payment.customerName,
        payment.externalReference,
        payment.description,
        payment.billingType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return source.includes(term);
    });
  }, [payments, searchTerm]);

  const stats = useMemo(() => {
    const totals = payments.reduce(
      (acc, payment) => {
        acc.total += payment.value;
        if (payment.status === "PENDING" || payment.status === "OVERDUE") {
          acc.pendentes += payment.value;
        }
        if (payment.status === "RECEIVED" || payment.status === "CONFIRMED") {
          acc.recebidos += payment.value;
        }
        return acc;
      },
      { total: 0, pendentes: 0, recebidos: 0 },
    );
    return totals;
  }, [payments]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            Pagamentos via Asaas
          </h2>
          <p className="text-sm text-gray-500">
            Consulte a fila de cobranças geradas diretamente no provedor.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2"
        >
          <RefreshCcw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-green-50 to-white">
          <p className="text-sm text-gray-600">Total processado</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(stats.total)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-white">
          <p className="text-sm text-gray-600">Pendente/Em aberto</p>
          <p className="text-2xl font-semibold text-yellow-700">
            {formatCurrency(stats.pendentes)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-sm text-gray-600">Recebido/Confirmado</p>
          <p className="text-2xl font-semibold text-emerald-700">
            {formatCurrency(stats.recebidos)}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por cliente, referência ou descrição..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as AsaasPaymentStatus | "all")
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "Todos os status" : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Carregando...</div>
        ) : isError ? (
          <div className="py-12 text-center text-gray-500 space-y-4">
            <p>Não foi possível carregar os pagamentos.</p>
            {error instanceof Error && (
              <p className="text-sm text-gray-400">{error.message}</p>
            )}
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Referência
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">
                        {payment.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.description || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(payment.value)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {payment.billingType}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex ${statusBadge(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(payment.dueDate)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {payment.externalReference || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex gap-2">
                        {payment.invoiceUrl && (
                          <a
                            href={payment.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Fatura
                          </a>
                        )}
                        {payment.transactionReceiptUrl && (
                          <a
                            href={payment.transactionReceiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Recibo
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                Nenhum pagamento encontrado para os filtros atuais.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AsaasPaymentsPanel;
