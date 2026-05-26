"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Search, UserPlus, Users } from "lucide-react";
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
  pagamentos: Pagamento[] = [],
): DashboardCliente["status"] => {
  const normalized = (status ?? "").toUpperCase();
  if (normalized.includes("PEND")) return "Pendente";
  if (normalized.includes("INAT") || normalized.includes("CANCEL"))
    return "Cancelado";

  if (pagamentos.length > 0) {
    const ultimoPagamento = [...pagamentos].sort((a, b) => {
      const dataA = new Date(
        a.dataVencimento || a.dataPagamento || 0,
      ).getTime();
      const dataB = new Date(
        b.dataVencimento || b.dataPagamento || 0,
      ).getTime();
      return dataB - dataA;
    })[0];

    if (["PAGO", "RECEBIDO"].includes(ultimoPagamento.status)) return "Pago";
    return "Pendente";
  }

  return "Pendente";
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
  status: statusPlanoToDashboard(cliente.statusPlano, cliente.pagamentos),
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
              <UserPlus className="h-[18px] w-[18px] text-[#1EBA4B]" />
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
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-[18px] w-[18px]"
              >
                <path
                  d="M16.5 6.41663H18.9439C17.1628 3.31006 13.7217 1.48957 9.98261 1.8874C5.79348 2.33382 2.38168 5.72638 1.89677 9.91094C1.25511 15.4494 5.58723 20.1665 11.0001 20.1665C16.0546 20.1665 20.1667 16.0544 20.1667 10.9999C20.1667 10.493 20.5764 10.0833 21.0833 10.0833C21.5903 10.0833 22 10.493 22 10.9999C22 17.2094 16.8291 22.2336 10.5665 21.9916C4.90891 21.7725 0.227533 17.0921 0.0084515 11.4353C-0.234463 5.1718 4.79066 0 11.0001 0C14.7621 0 18.1546 1.86449 20.1621 4.89955L20.1667 2.74998C20.1667 2.24307 20.5764 1.83332 21.0833 1.83332C21.5903 1.83332 22 2.24307 22 2.74998V6.40838C22 7.42495 21.1759 8.24995 20.1584 8.24995H16.5C15.9931 8.24995 15.5834 7.8402 15.5834 7.33329C15.5834 6.82637 15.9931 6.41663 16.5 6.41663ZM11.0001 17.4166C11.5061 17.4166 11.9168 17.0068 11.9168 16.4999V15.5832C13.4329 15.5832 14.6667 14.3494 14.6667 12.8333C14.6667 11.5875 13.7739 10.5324 12.5447 10.328L9.75711 9.86419C9.4152 9.80735 9.16678 9.51402 9.16678 9.16661C9.16678 8.66061 9.57836 8.24995 10.0834 8.24995H12.1624C12.4888 8.24995 12.7931 8.42503 12.9572 8.7092C13.2083 9.14736 13.7693 9.29769 14.2093 9.04286C14.6475 8.78986 14.7978 8.22886 14.543 7.7907C14.0535 6.94279 13.1405 6.41663 12.1615 6.41663H11.9158V5.49997C11.9158 4.99305 11.5052 4.5833 10.9992 4.5833C10.4932 4.5833 10.0825 4.99305 10.0825 5.49997V6.41663C8.56637 6.41663 7.33255 7.65045 7.33255 9.16661C7.33255 10.4124 8.22538 11.4674 9.45462 11.6718L12.2413 12.1357C12.5841 12.1925 12.8325 12.4858 12.8325 12.8333C12.8325 13.3392 12.4218 13.7499 11.9158 13.7499H9.83686C9.51053 13.7499 9.2062 13.5748 9.04212 13.2907C8.78821 12.8516 8.22721 12.7013 7.78996 12.957C7.35088 13.21 7.20147 13.771 7.45538 14.2092C7.9458 15.0571 8.85879 15.5832 9.83686 15.5832H10.0825V16.4999C10.0825 17.0068 10.4932 17.4166 10.9992 17.4166H11.0001Z"
                  fill="#1EBA4B"
                />
              </svg>
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
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-[18px] w-[18px]"
              >
                <path
                  d="M2.75 20.1667H22V22H2.75C1.23383 22 0 20.7662 0 19.25V0H1.83333V19.25C1.83333 19.7551 2.24492 20.1667 2.75 20.1667ZM15.5833 4.58333V6.41667H18.8705L13.75 11.5372L10.0833 7.8705L3.93525 14.0186L5.23142 15.3148L10.0833 10.4628L13.75 14.1295L20.1667 7.71283V11H22V4.58333H15.5833Z"
                  fill="#1EBA4B"
                />
              </svg>
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
