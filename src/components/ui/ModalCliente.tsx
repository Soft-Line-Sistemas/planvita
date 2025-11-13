"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  plano: string;
  status: "Ativo" | "Pendente" | "Inativo";
  dataContrato: string;
  valor: number;
}

interface ModalClienteProps {
  cliente?: Cliente | null;
  open: boolean;
  onClose: () => void;
}

export default function ModalCliente({
  cliente,
  open,
  onClose,
}: ModalClienteProps) {
  if (!cliente) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  const getStatusBadge = (status: Cliente["status"]) => {
    switch (status) {
      case "Ativo":
        return (
          <span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded text-sm">
            <CheckCircle className="w-4 h-4 mr-1" /> Ativo
          </span>
        );
      case "Pendente":
        return (
          <span className="flex items-center text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-sm">
            <AlertCircle className="w-4 h-4 mr-1" /> Pendente
          </span>
        );
      default:
        return (
          <span className="flex items-center text-red-700 bg-red-100 px-2 py-1 rounded text-sm">
            Inativo
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Detalhes do Cliente
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o cliente selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {cliente.nome}
            </h2>
            <div className="mt-1">{getStatusBadge(cliente.status)}</div>
          </div>

          <div className="space-y-2 text-gray-700">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-500" /> {cliente.email}
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-gray-500" />{" "}
              {cliente.telefone}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" /> Contrato em{" "}
              {formatDate(cliente.dataContrato)}
            </div>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />{" "}
              {formatCurrency(cliente.valor)} ({cliente.plano})
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
