"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { formatPhone } from "@/helpers/formHelpers";

type FaixaTarifacao = {
  idadeMaxima: number | null;
  valor: number;
};

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
  limiteBeneficiarios: number;
  valorAdicionalDependenteForaGrade: number;
  valorAdicionalDependenteForaGradeFaixasJson: string | null;

  // Frota
  quilometragemMaxVeiculo: number;
  notificarManutencao: boolean;

  // Cemitérios
  prazoReserva: number;
  notificarTaxaVencida: boolean;

  // Redirecionamento WhatsApp por Idade
  redirecionamentoWhatsappAtivo: boolean;
  redirecionamentoWhatsappNumero: string;
  redirecionamentoWhatsappIdadeMin: number;
  redirecionamentoWhatsappIdadeMax: number;

  ativo: boolean;
};

function parseFaixas(json: string | null | undefined): FaixaTarifacao[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<BusinessRulesConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [faixas, setFaixas] = useState<FaixaTarifacao[]>([]);

  useEffect(() => {
    api.get(`/regras`).then((res) => {
      if (res.data.length > 0) {
        const data = res.data[0] as BusinessRulesConfig;
        setConfig(data);
        setFaixas(
          parseFaixas(data.valorAdicionalDependenteForaGradeFaixasJson),
        );
      }
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

  const handleFaixaChange = (
    index: number,
    field: keyof FaixaTarifacao,
    value: string,
  ) => {
    const updated = faixas.map((f, i) => {
      if (i !== index) return f;
      if (field === "idadeMaxima") {
        return { ...f, idadeMaxima: value === "" ? null : Number(value) };
      }
      return { ...f, valor: Number(value) };
    });
    setFaixas(updated);
  };

  const adicionarFaixa = () => {
    setFaixas([...faixas, { idadeMaxima: null, valor: 0 }]);
  };

  const removerFaixa = (index: number) => {
    setFaixas(faixas.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!config) return;

    const faixasValidas = faixas.filter((f) => f.valor > 0);
    const faixasJson =
      faixasValidas.length > 0 ? JSON.stringify(faixasValidas) : null;

    const payload = {
      ...config,
      valorAdicionalDependenteForaGradeFaixasJson: faixasJson,
    };

    try {
      if (config.tenantId) {
        await api.put(`/regras/${config.tenantId}`, payload);
      } else {
        await api.post(`/regras`, { ...payload, tenantId: user?.tenant });
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

      {/* Estoque e Serviços (oculto por enquanto)
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
      */}

      {/* Planos e Autorizações */}
      <Card>
        <CardHeader>
          <CardTitle>Planos e Autorizações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Matriz de tarifação progressiva por faixa etária */}
          <div className="border rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">
                Tarifação por faixa etária — dependentes fora da grade familiar
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                O valor cobrado por cada dependente adicional é determinado pela
                faixa etária dele. A última faixa (sem limite de idade) cobre
                todos os casos acima.
              </p>
            </div>

            {faixas.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma faixa configurada. O sistema usará o valor fixo abaixo
                como fallback.
              </p>
            )}

            {faixas.map((faixa, index) => {
              const isUltima = index === faixas.length - 1;
              const idadeInicioLabel =
                index === 0
                  ? "0"
                  : `${(faixas[index - 1].idadeMaxima ?? 0) + 1}`;

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-muted/40 rounded px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground w-28 shrink-0">
                    {isUltima && faixa.idadeMaxima === null
                      ? `Acima de ${idadeInicioLabel} anos`
                      : `De ${idadeInicioLabel} até`}
                  </span>

                  {!(isUltima && faixa.idadeMaxima === null) && (
                    <Input
                      type="number"
                      className="w-24"
                      placeholder="Até (anos)"
                      value={faixa.idadeMaxima ?? ""}
                      onChange={(e) =>
                        handleFaixaChange(index, "idadeMaxima", e.target.value)
                      }
                    />
                  )}

                  {!(isUltima && faixa.idadeMaxima === null) && (
                    <span className="text-xs text-muted-foreground">anos</span>
                  )}

                  <span className="text-xs text-muted-foreground ml-auto">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-28"
                    placeholder="Valor"
                    value={faixa.valor}
                    onChange={(e) =>
                      handleFaixaChange(index, "valor", e.target.value)
                    }
                  />

                  <button
                    type="button"
                    onClick={() => removerFaixa(index)}
                    className="text-red-500 hover:text-red-700 text-lg leading-none shrink-0"
                    title="Remover faixa"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={adicionarFaixa}
            >
              + Adicionar faixa etária
            </Button>
          </div>

          <div>
            <Label>
              Valor fixo (fallback — usado quando não há faixas configuradas)
              (R$)
            </Label>
            <Input
              type="number"
              step="0.01"
              className="w-40"
              value={config?.valorAdicionalDependenteForaGrade ?? 14.9}
              onChange={(e) =>
                handleChange(
                  "valorAdicionalDependenteForaGrade",
                  Number(e.target.value),
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Redirecionamento WhatsApp por Idade */}
      <Card>
        <CardHeader>
          <CardTitle>Redirecionamento WhatsApp por Idade</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex items-center gap-3">
            <input
              id="waRedirectAtivo"
              type="checkbox"
              checked={config?.redirecionamentoWhatsappAtivo ?? false}
              onChange={(e) =>
                handleChange("redirecionamentoWhatsappAtivo", e.target.checked)
              }
            />
            <Label htmlFor="waRedirectAtivo">
              Ativar redirecionamento de cadastro para WhatsApp fora da faixa de
              idade
            </Label>
          </div>
          <div className="col-span-2">
            <Label>Número de WhatsApp</Label>
            <Input
              type="text"
              placeholder="(67) 99999-0000"
              value={formatPhone(config?.redirecionamentoWhatsappNumero ?? "")}
              onChange={(e) =>
                handleChange(
                  "redirecionamentoWhatsappNumero",
                  e.target.value.replace(/\D/g, "").slice(0, 11),
                )
              }
            />
          </div>
          <div>
            <Label>Idade mínima (anos)</Label>
            <Input
              type="number"
              min={0}
              value={config?.redirecionamentoWhatsappIdadeMin ?? 18}
              onChange={(e) =>
                handleChange(
                  "redirecionamentoWhatsappIdadeMin",
                  Number(e.target.value),
                )
              }
            />
          </div>
          <div>
            <Label>Idade máxima (anos)</Label>
            <Input
              type="number"
              min={0}
              value={config?.redirecionamentoWhatsappIdadeMax ?? 65}
              onChange={(e) =>
                handleChange(
                  "redirecionamentoWhatsappIdadeMax",
                  Number(e.target.value),
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Frota (oculto por enquanto)
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
      */}

      {/* Cemitérios (oculto por enquanto)
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
      */}

      <Button
        className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        onClick={handleSave}
      >
        Salvar Regras de Negócio
      </Button>
    </div>
  );
}
