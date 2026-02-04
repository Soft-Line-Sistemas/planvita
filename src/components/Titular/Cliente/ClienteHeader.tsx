"use client";

import { Button } from "@/components/ui/button";
import { FileDown, PlusCircle, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onExport: () => void;
  onNewClient: () => void;
  consultorLink?: string;
  comissaoPendente?: number;
}

export const ClienteHeader = ({
  onExport,
  onNewClient,
  consultorLink,
  comissaoPendente,
}: Props) => {
  const handleCopyLink = () => {
    if (consultorLink) {
      navigator.clipboard.writeText(consultorLink);
      toast.success("Link copiado com sucesso!");
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500">
          Gerencie todos os titulares e dependentes cadastrados
        </p>
        {typeof comissaoPendente === "number" && (
          <p className="text-sm font-semibold text-emerald-700 mt-1">
            Comissão a receber: R$ {comissaoPendente.toFixed(2)}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {consultorLink && (
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Link de Cadastro
          </Button>
        )}
        <Button variant="outline" onClick={onExport}>
          <FileDown className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={onNewClient}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
    </div>
  );
};
