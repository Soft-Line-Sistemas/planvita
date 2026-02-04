"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";

type ComissaoItem = {
  id: number;
  valor: number;
  dataGeracao: string;
  statusPagamento: string;
  titular: {
    id: number;
    nome: string;
    email: string | null;
    telefone: string | null;
  };
  contaPagar: {
    id: number;
    descricao: string;
    valor: number;
    status: string;
    vencimento: string;
    dataPagamento: string | null;
  } | null;
};

type ComissoesResponse = {
  comissoes: ComissaoItem[];
  totais: { pendente: number; pago: number };
};

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function MinhasComissoesPage() {
  const { user, hasPermission } = useAuth();
  const canView = hasPermission("titular.view");

  const { data, isLoading, isError } = useQuery<ComissoesResponse>({
    queryKey: ["consultor", "comissoes"],
    queryFn: async () => {
      const { data } = await api.get("/consultor/me/comissoes");
      return data;
    },
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="p-6">
        Você não possui permissão para visualizar comissões.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Minhas Comissões</h1>
      <p className="text-sm text-gray-600">{user?.nome}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pendente</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">
            {moeda.format(data?.totais.pendente ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pago</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">
            {moeda.format(data?.totais.pago ?? 0)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Carregando...</p>}
          {isError && <p>Falha ao carregar comissões.</p>}
          {!isLoading && !isError && (data?.comissoes?.length ?? 0) === 0 && (
            <p>Nenhuma comissão encontrada.</p>
          )}
          {!isLoading && !isError && (data?.comissoes?.length ?? 0) > 0 && (
            <div className="space-y-3">
              {data!.comissoes.map((comissao) => (
                <div key={comissao.id} className="border rounded p-3">
                  <div className="flex justify-between">
                    <strong>{comissao.titular.nome}</strong>
                    <span>{moeda.format(comissao.valor)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {comissao.statusPagamento} | Gerada em:{" "}
                    {new Date(comissao.dataGeracao).toLocaleDateString("pt-BR")}
                  </div>
                  {comissao.contaPagar && (
                    <div className="text-xs text-gray-500">
                      Conta a pagar #{comissao.contaPagar.id} (
                      {comissao.contaPagar.status})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
