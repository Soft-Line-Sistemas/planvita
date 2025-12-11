// This page uses client-side permission checks.
"use client";

import { CadastroClienteWizard } from "@/components/CadastroClienteWizard";
import { useAuth } from "@/hooks/useAuth";

export default function PainelCadastroClientePage() {
  const { hasPermission } = useAuth();

  if (!hasPermission("titular.create")) {
    return (
      <div className="p-8">
        <div className="text-sm text-gray-600">
          Você não tem permissão para cadastrar clientes.
        </div>
      </div>
    );
  }

  return <CadastroClienteWizard variant="dashboard" />;
}
