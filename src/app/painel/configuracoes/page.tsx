"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

type BusinessRulesConfig = {
  tenantId: string;

  // Financeiro
  diasAvisoVencimento: number;
  diasAvisoPendencia: number;
  repeticaoPendenciaDias: number;
  diasSuspensaoPreventiva: number;
  diasSuspensao: number;
  diasPosSuspensao: number;
  avisoReajusteAnual: boolean;
  avisoRenovacaoAutomatica: boolean;

  // Textos de aviso de suspensão
  textoSuspensaoPreventiva: string;
  textoSuspensao: string;
  textoPosSuspensao: string;

  // Estoque e Serviços
  permitirEstoqueNegativo: boolean;
  notificarEstoqueBaixo: boolean;

  // Planos e Autorizações
  idadeMaximaDependente: number;
  limiteBeneficiarios: number;

  // Frota
  quilometragemMaxVeiculo: number;
  notificarManutencao: boolean;

  // Cemitérios
  prazoReserva: number;
  notificarTaxaVencida: boolean;

  ativo: boolean;
};

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<BusinessRulesConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/v1/regras`).then((res) => {
      if (res.data.length > 0) setConfig(res.data[0]);
      setLoading(false);
    });
  }, []);

  const handleChange = (
    field: keyof BusinessRulesConfig,
    value: string | number | boolean,
  ) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      if (config.tenantId) {
        await api.put(`/api/v1/regras/${config.tenantId}`, config);
      } else {
        await api.post(`/api/v1/regras`, { ...config, tenantId: user?.tenant });
      }
      alert("Regras de negócio salvas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar regras de negócio.");
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Configurações de Regras de Negócio</h1>

      {/* Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Dias para aviso de vencimento</Label>
            <Input
              type="number"
              value={config?.diasAvisoVencimento || 2}
              onChange={(e) =>
                handleChange("diasAvisoVencimento", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Dias para aviso de pendência</Label>
            <Input
              type="number"
              value={config?.diasAvisoPendencia || 1}
              onChange={(e) =>
                handleChange("diasAvisoPendencia", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Repetição de aviso pendência (dias)</Label>
            <Input
              type="number"
              value={config?.repeticaoPendenciaDias || 5}
              onChange={(e) =>
                handleChange("repeticaoPendenciaDias", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Dias para suspensão preventiva</Label>
            <Input
              type="number"
              value={config?.diasSuspensaoPreventiva || 85}
              onChange={(e) =>
                handleChange("diasSuspensaoPreventiva", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Dias para suspensão</Label>
            <Input
              type="number"
              value={config?.diasSuspensao || 90}
              onChange={(e) =>
                handleChange("diasSuspensao", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Dias pós-suspensão</Label>
            <Input
              type="number"
              value={config?.diasPosSuspensao || 92}
              onChange={(e) =>
                handleChange("diasPosSuspensao", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Aviso de reajuste anual</Label>
            <input
              type="checkbox"
              checked={config?.avisoReajusteAnual || false}
              onChange={(e) =>
                handleChange("avisoReajusteAnual", e.target.checked)
              }
            />
          </div>
          <div>
            <Label>Aviso de renovação automática</Label>
            <input
              type="checkbox"
              checked={config?.avisoRenovacaoAutomatica || false}
              onChange={(e) =>
                handleChange("avisoRenovacaoAutomatica", e.target.checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Avisos de Suspensão */}
      <Card>
        <CardHeader>
          <CardTitle>Avisos de Suspensão</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div>
            <Label>Texto de aviso - Suspensão Preventiva</Label>
            <Input
              type="text"
              value={
                config?.textoSuspensaoPreventiva ||
                "Seu contrato está próximo da suspensão"
              }
              onChange={(e) =>
                handleChange("textoSuspensaoPreventiva", e.target.value)
              }
            />
          </div>
          <div>
            <Label>Texto de aviso - Suspensão</Label>
            <Input
              type="text"
              value={
                config?.textoSuspensao ||
                "Seu contrato foi suspenso. Regularize para retomar benefícios"
              }
              onChange={(e) => handleChange("textoSuspensao", e.target.value)}
            />
          </div>
          <div>
            <Label>Texto de aviso - Pós-Suspensão</Label>
            <Input
              type="text"
              value={
                config?.textoPosSuspensao ||
                "Seu contrato permanece suspenso. Regularize para retomar benefícios"
              }
              onChange={(e) =>
                handleChange("textoPosSuspensao", e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Estoque e Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Estoque e Serviços</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Permitir estoque negativo</Label>
            <input
              type="checkbox"
              checked={config?.permitirEstoqueNegativo || false}
              onChange={(e) =>
                handleChange("permitirEstoqueNegativo", e.target.checked)
              }
            />
          </div>
          <div>
            <Label>Notificar estoque baixo</Label>
            <input
              type="checkbox"
              checked={config?.notificarEstoqueBaixo || false}
              onChange={(e) =>
                handleChange("notificarEstoqueBaixo", e.target.checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Planos e Autorizações */}
      <Card>
        <CardHeader>
          <CardTitle>Planos e Autorizações</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Idade máxima do dependente</Label>
            <Input
              type="number"
              value={config?.idadeMaximaDependente || 18}
              onChange={(e) =>
                handleChange("idadeMaximaDependente", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Limite de beneficiários</Label>
            <Input
              type="number"
              value={config?.limiteBeneficiarios || 5}
              onChange={(e) =>
                handleChange("limiteBeneficiarios", Number(e.target.value))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Frota */}
      <Card>
        <CardHeader>
          <CardTitle>Frota</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Quilometragem máxima do veículo</Label>
            <Input
              type="number"
              value={config?.quilometragemMaxVeiculo || 100000}
              onChange={(e) =>
                handleChange("quilometragemMaxVeiculo", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Notificar manutenção</Label>
            <input
              type="checkbox"
              checked={config?.notificarManutencao || false}
              onChange={(e) =>
                handleChange("notificarManutencao", e.target.checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Cemitérios */}
      <Card>
        <CardHeader>
          <CardTitle>Cemitérios</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Prazo de reserva (dias)</Label>
            <Input
              type="number"
              value={config?.prazoReserva || 30}
              onChange={(e) =>
                handleChange("prazoReserva", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Notificar taxa vencida</Label>
            <input
              type="checkbox"
              checked={config?.notificarTaxaVencida || false}
              onChange={(e) =>
                handleChange("notificarTaxaVencida", e.target.checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        onClick={handleSave}
      >
        Salvar Regras de Negócio
      </Button>
    </div>
  );
}
