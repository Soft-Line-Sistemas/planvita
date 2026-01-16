"use client";

import React from "react";
import { useMetricasRecorrencia } from "@/hooks/queries/useMetricasRecorrencia";
import { Loader2, TrendingUp, Users, DollarSign, Activity } from "lucide-react";

export const MetricasRecorrencia: React.FC = () => {
  const { data, isLoading, isError } = useMetricasRecorrencia();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Carregando métricas...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600">
        Erro ao carregar métricas de recorrência.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card
        title="MRR (Receita Recorrente)"
        value={data.mrr}
        type="currency"
        icon={TrendingUp}
        color="indigo"
      />
      <Card
        title="Receita Única (Mês)"
        value={data.revenueOneTime}
        type="currency"
        icon={DollarSign}
        color="green"
      />
      <Card
        title="Assinaturas Ativas"
        value={data.activeSubscriptions}
        type="number"
        icon={Users}
        color="blue"
      />
      <Card
        title="Taxa de Churn (Mês)"
        value={data.churnRate}
        type="percentage"
        icon={Activity}
        color="red"
      />
    </div>
  );
};

const Card = ({
  title,
  value,
  type,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  type: "currency" | "number" | "percentage";
  icon: React.ElementType;
  color: string;
}) => {
  const formattedValue =
    type === "currency"
      ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      : type === "percentage"
        ? `${value.toFixed(1)}%`
        : value;

  const colorClasses: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{formattedValue}</p>
      </div>
    </div>
  );
};
