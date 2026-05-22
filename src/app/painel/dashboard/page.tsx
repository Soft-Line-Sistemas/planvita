"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChartNoAxesColumn,
  CircleDollarSign,
  Pencil,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { Cliente as ClienteType } from "@/types/ClientType";
import { Pagamento } from "@/types/PaymentType";
import { useClientes } from "@/hooks/queries/useClientes";
import { usePagamentos } from "@/hooks/queries/usePagamentos";
import { useAuth } from "@/hooks/useAuth";

type DashboardCliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  plano: string;
  carteira: string;
  status: "Pago" | "Pendente" | "Cancelado";
  dataContrato: string;
  valor: number;
};

const statusPlanoToDashboard = (
  status?: string | null,
): DashboardCliente["status"] => {
  const normalized = (status ?? "").toUpperCase();
  if (normalized.includes("PEND")) return "Pendente";
  if (normalized.includes("INAT") || normalized.includes("CANCEL"))
    return "Cancelado";
  return "Pago";
};

const mapClienteToDashboard = (
  cliente: ClienteType,
  carteiraTenant: string,
): DashboardCliente => ({
  carteira: carteiraTenant,
  id: String(cliente.id),
  nome: cliente.nome,
  email: cliente.email,
  telefone: cliente.telefone,
  plano: cliente.plano?.nome ?? "Plano não informado",
  status: statusPlanoToDashboard(cliente.statusPlano),
  dataContrato: cliente.dataContratacao ?? "",
  valor: Number(cliente.plano?.valorMensal ?? 0),
});

const countClientesByMonth = (
  clientes: ClienteType[],
  year: number,
  month: number,
) => {
  return clientes.filter((cliente) => {
    if (!cliente.dataContratacao) return false;
    const data = new Date(cliente.dataContratacao);
    return (
      data.getFullYear() === year &&
      data.getMonth() === month &&
      !Number.isNaN(data.getTime())
    );
  }).length;
};

const calcularReceitaMensal = (
  pagamentos: Pagamento[],
  month: number,
  year: number,
) => {
  return pagamentos
    .filter((pagamento) => {
      if (pagamento.status !== "PAGO" || !pagamento.dataPagamento) return false;
      const data = new Date(pagamento.dataPagamento);
      return (
        data.getMonth() === month &&
        data.getFullYear() === year &&
        !Number.isNaN(data.getTime())
      );
    })
    .reduce((total, pagamento) => total + pagamento.valor, 0);
};

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: clientesData, isLoading: isLoadingClientes } = useClientes({
    page: 1,
    limit: 100,
    search,
    status: statusFilter,
    plano: "todos",
  });
  const { data: pagamentosData, isLoading: isLoadingPagamentos } =
    usePagamentos();

  const clientes = useMemo(() => clientesData?.data ?? [], [clientesData]);
  const carteiraTenant = user?.tenant ?? "—";
  const totalClientes = clientesData?.total ?? clientes.length;
  const pagamentos = useMemo(() => pagamentosData ?? [], [pagamentosData]);

  const dashboardClientes = useMemo(
    () =>
      clientes.map((cliente) => mapClienteToDashboard(cliente, carteiraTenant)),
    [clientes, carteiraTenant],
  );

  const recentClientes = useMemo(() => {
    return [...dashboardClientes]
      .sort(
        (a, b) =>
          new Date(b.dataContrato).getTime() -
          new Date(a.dataContrato).getTime(),
      )
      .slice(0, 5);
  }, [dashboardClientes]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : (currentMonth - 1 + 12) % 12;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const novosClientesMes = useMemo(
    () => countClientesByMonth(clientes, currentYear, currentMonth),
    [clientes, currentMonth, currentYear],
  );

  const novosClientesMesAnterior = useMemo(
    () => countClientesByMonth(clientes, previousYear, previousMonth),
    [clientes, previousMonth, previousYear],
  );

  const crescimentoMensal =
    novosClientesMesAnterior === 0
      ? novosClientesMes > 0
        ? 100
        : 0
      : Number(
          (
            ((novosClientesMes - novosClientesMesAnterior) /
              novosClientesMesAnterior) *
            100
          ).toFixed(1),
        );

  const receitaMensal = useMemo(
    () => calcularReceitaMensal(pagamentos, currentMonth, currentYear),
    [pagamentos, currentMonth, currentYear],
  );

  const totalAtivos = useMemo(
    () =>
      clientes.filter(
        (cliente) => (cliente.statusPlano ?? "").toUpperCase() === "ATIVO",
      ).length,
    [clientes],
  );

  const taxaConversao =
    totalClientes > 0
      ? Number(((totalAtivos / totalClientes) * 100).toFixed(1))
      : 0;

  const isLoadingData = isLoadingClientes || isLoadingPagamentos;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  const statusPillClass = (status: DashboardCliente["status"]) => {
    if (status === "Pago") return "bg-[#E3FEC8] text-[#658D3E]";
    if (status === "Pendente") return "bg-[#FFD883] text-[#AF671F]";
    return "bg-[#FFDEDD] text-[#F03939]";
  };

  const rowMarkerClass = (status: DashboardCliente["status"]) => {
    if (status === "Pago") return "bg-[#1EBA4B]";
    if (status === "Pendente") return "bg-[#F0B73E]";
    return "bg-[#F04A4A]";
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[34px] font-semibold text-[#121317]">Dashboard</h1>
        <Button
          onClick={() => router.push("/painel/cliente/cadastro")}
          className="rounded-full bg-[#1EBA4B] px-5 py-2 font-semibold text-white hover:bg-green-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[20px]">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center justify-between text-[22px] font-semibold text-[#202020]">
              Total de clientes
              <Users className="h-[18px] w-[18px] text-[#1EBA4B]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[46px] leading-none font-semibold text-[#141A2A]">
              {isLoadingData ? "—" : totalClientes.toLocaleString("pt-BR")}
            </p>
            <p className="mt-3 text-[20px] text-[#9A9A9A]">
              Base ativa de clientes
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[20px]">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center justify-between text-[22px] font-semibold text-[#202020]">
              Novos este mês
              <Users className="h-[18px] w-[18px] text-[#1EBA4B]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[46px] leading-none font-semibold text-[#141A2A]">
              {isLoadingData ? "—" : novosClientesMes}
            </p>
            <p className="mt-3 text-[20px] text-[#9A9A9A]">
              {isLoadingData ? "—" : `${crescimentoMensal}% vs mês anterior`}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[20px]">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center justify-between text-[22px] font-semibold text-[#202020]">
              Receita Mensal
              <CircleDollarSign className="h-[18px] w-[18px] text-[#1EBA4B]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[46px] leading-none font-semibold text-[#141A2A]">
              {isLoadingData ? "—" : formatCurrency(receitaMensal)}
            </p>
            <p className="mt-3 text-[20px] text-[#9A9A9A]">
              0% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[20px]">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center justify-between text-[22px] font-semibold text-[#202020]">
              Taxa de conversão
              <ChartNoAxesColumn className="h-[18px] w-[18px] text-[#1EBA4B]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[46px] leading-none font-semibold text-[#141A2A]">
              {isLoadingData ? "—" : `${taxaConversao}%`}
            </p>
            <p className="mt-3 text-[20px] text-[#9A9A9A]">
              {isLoadingData ? "—" : `${totalAtivos} clientes ativos`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-[28px] font-semibold text-[#202020]">
              <span className="inline-flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1EBA4B]" />
                Clientes recentes
                <span className="text-[#1EBA4B]">
                  ({recentClientes.length})
                </span>
              </span>
            </CardTitle>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9E9E]" />
              <input
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                className="w-full rounded-[16px] border border-[#D5D5D5] bg-white py-3 pl-11 pr-4 text-sm"
                placeholder="Pesquisar cliente"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(ev) => setStatusFilter(ev.target.value)}
              className="w-full md:w-56 rounded-[16px] border border-[#D5D5D5] bg-white px-4 py-3 text-sm"
            >
              <option value="todos">Status</option>
              <option value="Ativo">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Inativo">Cancelado</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-[#ECECEC] text-xs text-[#7A7A7A]">
                  <th className="px-3 py-3 font-medium">ID</th>
                  <th className="px-3 py-3 font-medium">Nome</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Telefone</th>
                  <th className="px-3 py-3 font-medium">Plano</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Carteira</th>
                  <th className="px-3 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingData && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-6 text-sm text-[#8E8E8E]"
                    >
                      Carregando clientes...
                    </td>
                  </tr>
                )}

                {!isLoadingData && recentClientes.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-6 text-sm text-[#8E8E8E]"
                    >
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}

                {!isLoadingData &&
                  recentClientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-[#F1F1F1]">
                      <td className="relative px-3 py-3 text-sm text-[#3A3A3A]">
                        <span
                          className={`absolute left-0 top-1/2 h-10 w-[2px] -translate-y-1/2 rounded-[20px] ${rowMarkerClass(cliente.status)}`}
                        />
                        {cliente.id}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-[#EEF6EC] text-[#1EBA4B] text-xs font-semibold">
                              {getInitials(cliente.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-[#343434]">
                            {cliente.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4A4A4A]">
                        {cliente.email}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4A4A4A]">
                        {cliente.telefone}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-[#FFF0DB] px-3 py-1 text-xs font-semibold text-[#A36E25]">
                          {cliente.plano}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(cliente.status)}`}
                        >
                          {cliente.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-[#4A4A4A]">
                        {cliente.carteira}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/painel/cliente/${cliente.id}/detalhes`,
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#DCDCDC] text-[#666] hover:bg-gray-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
