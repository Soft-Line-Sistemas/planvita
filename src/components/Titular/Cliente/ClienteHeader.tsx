"use client";

import { Button } from "@/components/ui/button";
import { FileDown, PlusCircle } from "lucide-react";

interface Props {
  onExport: () => void;
  onNewClient: () => void;
}

export const ClienteHeader = ({ onExport, onNewClient }: Props) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
      <p className="text-sm text-gray-500">
        Gerencie todos os titulares e dependentes cadastrados
      </p>
    </div>

    <div className="flex gap-2">
      <Button variant="outline" onClick={onExport}>
        <FileDown className="w-4 h-4 mr-2" />
        Exportar
      </Button>
      <Button className="bg-green-600 hover:bg-green-700" onClick={onNewClient}>
        <PlusCircle className="w-4 h-4 mr-2" />
        Novo Cliente
      </Button>
    </div>
  </div>
);
