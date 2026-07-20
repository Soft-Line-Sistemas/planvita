"use client";
import React from "react";
import { Veiculo } from "@/types/VeiculoType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Pencil, Trash2, Truck } from "lucide-react";

export default function VeiculoTable({
  veiculos,
  loading,
  error,
  onEdit,
  onDelete,
}: {
  veiculos: Veiculo[];
  loading: boolean;
  error: string | null;
  onEdit: (v: Veiculo) => void;
  onDelete: (id: number) => void;
}) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white p-12 text-center shadow-sm">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Placa</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Km atual</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : veiculos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12">
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                  <Truck className="h-8 w-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium">
                    Nenhum veículo cadastrado.
                  </p>
                  <p className="text-xs">
                    Adicione o primeiro veículo da frota para começar.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            veiculos.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.placa}</TableCell>
                <TableCell>{v.modelo}</TableCell>
                <TableCell>{v.ano}</TableCell>
                <TableCell>{v.tipo}</TableCell>
                <TableCell>
                  {v.quilometragemAtual != null
                    ? `${v.quilometragemAtual.toLocaleString("pt-BR")} km`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={v.ativo ? "default" : "outline"}>
                    {v.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(v)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(v.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
