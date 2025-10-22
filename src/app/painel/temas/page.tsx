"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

type LayoutConfig = {
  id?: number;
  nomeTema: string;
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corTexto: string;
  corBotaoPrimario: string;
  corBotaoSecundario: string;
  corLink: string;
  fontePrimaria: string;
  fonteSecundaria?: string;
  tamanhoFonteBase: number;
  tamanhoFonteTitulo: number;
  logoUrl?: string;
  faviconUrl?: string;
  backgroundUrl?: string;
  bordaRadius?: number;
  sombraPadrao?: string;
  ativo?: boolean;
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<LayoutConfig>({
    nomeTema: "",
    corPrimaria: "#007bff",
    corSecundaria: "#6c757d",
    corFundo: "#ffffff",
    corTexto: "#000000",
    corBotaoPrimario: "#007bff",
    corBotaoSecundario: "#6c757d",
    corLink: "#007bff",
    fontePrimaria: "Arial, sans-serif",
    fonteSecundaria: "",
    tamanhoFonteBase: 14,
    tamanhoFonteTitulo: 18,
    logoUrl: "",
    faviconUrl: "",
    backgroundUrl: "",
    bordaRadius: 4,
    sombraPadrao: "0px 2px 4px rgba(0,0,0,0.1)",
    ativo: true,
  });

  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/layout`).then((res) => {
      if (res.data.length > 0) setConfig(res.data[0]);
      setLoading(false);
    });
  }, []);

  const handleChange = (field: keyof LayoutConfig, value: string | number) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      if (config.id) {
        await api.put(`/layout/${config.id}`, {
          ...config,
          tenantId: user?.tenant,
        });
      } else {
        await api.post(`/layout`, { ...config, tenantId: user?.tenant });
      }
      alert("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações.");
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Configurações da Plataforma</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cor do Botão</Label>
            <Input
              type="color"
              value={config?.corPrimaria || "#007bff"}
              onChange={(e) => handleChange("corPrimaria", e.target.value)}
            />
          </div>
          <div>
            <Label>Cor dos contornos</Label>
            <Input
              type="color"
              value={config?.corSecundaria || "#6c757d"}
              onChange={(e) => handleChange("corSecundaria", e.target.value)}
            />
          </div>
          <div>
            <Label>Cor de Fundo</Label>
            <Input
              type="color"
              value={config?.corFundo || "#ffffff"}
              onChange={(e) => handleChange("corFundo", e.target.value)}
            />
          </div>
          <div>
            <Label>Cor do Texto</Label>
            <Input
              type="color"
              value={config?.corTexto || "#000000"}
              onChange={(e) => handleChange("corTexto", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipografia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fonte Primária</Label>
            <Input
              value={config?.fontePrimaria || ""}
              onChange={(e) => handleChange("fontePrimaria", e.target.value)}
            />
          </div>
          <div>
            <Label>Fonte Secundária</Label>
            <Input
              value={config?.fonteSecundaria || ""}
              onChange={(e) => handleChange("fonteSecundaria", e.target.value)}
            />
          </div>
          <div>
            <Label>Tamanho Base</Label>
            <Input
              type="number"
              value={config?.tamanhoFonteBase || 14}
              onChange={(e) =>
                handleChange("tamanhoFonteBase", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label>Tamanho Títulos</Label>
            <Input
              type="number"
              value={config?.tamanhoFonteTitulo || 18}
              onChange={(e) =>
                handleChange("tamanhoFonteTitulo", Number(e.target.value))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imagens e Logos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Logo URL</Label>
            <Input
              value={config?.logoUrl || ""}
              onChange={(e) => handleChange("logoUrl", e.target.value)}
            />
          </div>
          <div>
            <Label>Favicon URL</Label>
            <Input
              value={config?.faviconUrl || ""}
              onChange={(e) => handleChange("faviconUrl", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>Salvar Configurações</Button>
    </div>
  );
}
