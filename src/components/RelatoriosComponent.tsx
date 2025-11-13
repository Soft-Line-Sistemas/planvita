"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { StatusPagamento, Pagamento } from "@/types/PaymentType";

interface RelatoriosProps {
  pagamentos: Pagamento[];
  isLoading?: boolean;
}

export const RelatoriosComponent: React.FC<RelatoriosProps> = ({
  pagamentos,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusPagamento | "todos">(
    "todos",
  );

  const filteredPagamentos = pagamentos.filter((p) => {
    const matchTerm =
      p.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente.cpf.includes(searchTerm);
    const matchStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchTerm && matchStatus;
  });

  // Exportar Excel
  const handleExportExcel = () => {
    const worksheetData = filteredPagamentos.map((p) => ({
      Cliente: p.cliente.nome,
      Email: p.cliente.email,
      CPF: p.cliente.cpf,
      Valor: p.valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      Vencimento: p.dataVencimento,
      Pagamento: p.dataPagamento ?? "-",
      Status: p.status,
      Método: p.metodoPagamento,
      Referencia: p.referencia,
      Observacoes: p.observacoes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagamentos");
    XLSX.writeFile(workbook, "relatorio_pagamentos.xlsx");
  };

  // Exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Pagamentos", 14, 20);
    const tableData = filteredPagamentos.map((p) => [
      p.cliente.nome,
      p.cliente.email,
      p.cliente.cpf,
      p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      p.dataVencimento,
      p.dataPagamento ?? "-",
      p.status,
      p.metodoPagamento,
      p.referencia,
      p.observacoes,
    ]);
    autoTable(doc, {
      head: [
        [
          "Cliente",
          "Email",
          "CPF",
          "Valor",
          "Vencimento",
          "Pagamento",
          "Status",
          "Método",
          "Referencia",
          "Observações",
        ],
      ],
      body: tableData,
      startY: 30,
    });
    doc.save("relatorio_pagamentos.pdf");
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
            <Input
              placeholder="Buscar por cliente, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              className="border rounded-md p-2"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusPagamento | "todos")
              }
            >
              <option value="todos">Todos Status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="VENCIDO">Vencido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>

            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-1" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-1" />
              Exportar PDF
            </Button>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            {isLoading && (
              <p className="text-center text-gray-500 my-6">
                Carregando pagamentos...
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPagamentos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.cliente.nome}</TableCell>
                    <TableCell>{p.cliente.email}</TableCell>
                    <TableCell>{p.cliente.cpf}</TableCell>
                    <TableCell>
                      {p.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell>{p.dataVencimento}</TableCell>
                    <TableCell>{p.dataPagamento ?? "-"}</TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell>{p.metodoPagamento}</TableCell>
                    <TableCell>{p.referencia}</TableCell>
                    <TableCell>{p.observacoes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredPagamentos.length === 0 && (
              <p className="text-center text-gray-500 mt-4">
                Nenhum pagamento encontrado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
