"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ReceiptText,
} from "lucide-react";

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

const statusBadgeVariant = (
  status: string,
): "default" | "secondary" | "outline" => {
  const normalized = status.toUpperCase();
  if (normalized === "PAGO" || normalized === "RECEBIDO") return "default";
  if (normalized === "PENDENTE") return "secondary";
  return "outline";
};

export default function MinhasComissoesPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const canView = hasPermission("titular.view");

  const { data, isLoading, isError } = useQuery<ComissoesResponse>({
    queryKey: ["consultor", "comissoes"],
    queryFn: async () => {
      const { data } = await api.get("/consultor/me/comissoes");
      return data;
    },
    enabled: canView,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando...
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sem permissão</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Você não possui permissão para visualizar comissões.
          </CardContent>
        </Card>
      </div>
    );
  }

  const comissoes = data?.comissoes ?? [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minhas Comissões</h1>
        <p className="text-sm text-muted-foreground mt-1">{user?.nome}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 leading-none">
              {moeda.format(data?.totais.pendente ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Pendente</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-[#f2faf0] flex items-center justify-center text-primary flex-shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary leading-none">
              {moeda.format(data?.totais.pago ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Pago</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold">Listagem</h3>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Falha ao carregar comissões.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gerada em</TableHead>
                <TableHead>Conta a pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : comissoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                      <ReceiptText className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium">
                        Nenhuma comissão encontrada.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                comissoes.map((comissao) => (
                  <TableRow key={comissao.id}>
                    <TableCell className="font-medium">
                      {comissao.titular.nome}
                    </TableCell>
                    <TableCell>{moeda.format(comissao.valor)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusBadgeVariant(comissao.statusPagamento)}
                      >
                        {comissao.statusPagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(comissao.dataGeracao).toLocaleDateString(
                        "pt-BR",
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {comissao.contaPagar
                        ? `#${comissao.contaPagar.id} (${comissao.contaPagar.status})`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
