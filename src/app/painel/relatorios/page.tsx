// app/relatorios/page.tsx
"use client";

import { useState } from "react";
import { RelatoriosComponent } from "@/components/RelatoriosComponent"; // Importe como named export
import { Cliente } from "@/types/ClientType";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

// Mock clientes
const mockClientes: Cliente[] = [
  {
    id: "1",
    nome: "Maria Silva",
    cpf: "123.456.789-01",
    email: "maria@email.com",
    telefone: "(71) 99999-1234",
    whatsapp: "(71) 99999-1234",
    dataNascimento: "1985-05-15",
    idade: 39,
    endereco: {
      cep: "40000-000",
      uf: "BA",
      cidade: "Salvador",
      bairro: "Centro",
      logradouro: "Rua A",
      numero: "123",
    },
    statusPlano: "Ativo",
    dataContratacao: "2024-01-15",
    dataCarencia: "2024-02-15",
    carenciaRestante: 0,
    diaVencimento: 15,
    plano: {
      id: "P001",
      nome: "Bosque Família",
      valorMensal: 89.9,
      coberturas: {
        servicosPadrao: [],
        coberturaTranslado: [],
        servicosEspecificos: [],
      },
    },
    consultor: {
      nome: "Carlos",
      codigo: "C001",
      email: "carlos@empresa.com",
      telefone: "(71) 98888-0000",
    },
    dependentes: [],
    pagamentos: [],
  },
];

export default function RelatoriosPage() {
  const [clientes, setClientes] = useState<Cliente[]>(mockClientes);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-8 space-y-6">
      {/* Filtro de busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Clientes</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>Aplicar</Button>
        </CardContent>
      </Card>

      {/* Componente de relatórios */}
      <RelatoriosComponent clientes={filteredClientes} />
    </div>
  );
}
