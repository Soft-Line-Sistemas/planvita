"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-9 shrink-0 rounded-md border border-input overflow-hidden cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-1 -left-1 h-11 w-11 cursor-pointer border-0 p-0"
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<LayoutConfig>({
    nomeTema: "",
    corPrimaria: "#3a9b28",
    corSecundaria: "#6c757d",
    corFundo: "#ffffff",
    corTexto: "#000000",
    corBotaoPrimario: "#3a9b28",
    corBotaoSecundario: "#6c757d",
    corLink: "#3a9b28",
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
  const [saving, setSaving] = useState(false);
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

    setSaving(true);
    try {
      if (config.id) {
        await api.put(`/layout/${config.id}`, {
          ...config,
          tenantId: user?.tenant,
        });
      } else {
        await api.post(`/layout`, { ...config, tenantId: user?.tenant });
      }
      toast.success("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Configurações da Plataforma
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize as cores e a tipografia usadas na plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ColorField
                label="Cor do Botão"
                value={config?.corPrimaria || "#3a9b28"}
                onChange={(v) => handleChange("corPrimaria", v)}
              />
              <ColorField
                label="Cor dos contornos"
                value={config?.corSecundaria || "#6c757d"}
                onChange={(v) => handleChange("corSecundaria", v)}
              />
              <ColorField
                label="Cor de Fundo"
                value={config?.corFundo || "#ffffff"}
                onChange={(v) => handleChange("corFundo", v)}
              />
              <ColorField
                label="Cor do Texto"
                value={config?.corTexto || "#000000"}
                onChange={(v) => handleChange("corTexto", v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipografia</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fonte Primária</Label>
                <Input
                  value={config?.fontePrimaria || ""}
                  onChange={(e) =>
                    handleChange("fontePrimaria", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fonte Secundária</Label>
                <Input
                  value={config?.fonteSecundaria || ""}
                  onChange={(e) =>
                    handleChange("fonteSecundaria", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tamanho Base</Label>
                <Input
                  type="number"
                  value={config?.tamanhoFonteBase || 14}
                  onChange={(e) =>
                    handleChange("tamanhoFonteBase", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input
                  value={config?.logoUrl || ""}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Favicon URL</Label>
                <Input
                  value={config?.faviconUrl || ""}
                  onChange={(e) => handleChange("faviconUrl", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configurações"
            )}
          </Button>
        </div>

        {/* Preview ao vivo */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: config.corFundo,
                  color: config.corTexto,
                  fontFamily: config.fontePrimaria,
                  borderColor: config.corSecundaria,
                }}
              >
                <div className="p-4 space-y-3">
                  <p
                    style={{
                      fontSize: `${config.tamanhoFonteTitulo}px`,
                      fontWeight: 700,
                    }}
                  >
                    Título de exemplo
                  </p>
                  <p style={{ fontSize: `${config.tamanhoFonteBase}px` }}>
                    Texto de exemplo usando a fonte e o tamanho configurados
                    para o corpo da plataforma.
                  </p>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{ color: config.corLink, fontSize: 14 }}
                    className="inline-block underline"
                  >
                    Link de exemplo
                  </a>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: config.corBotaoPrimario }}
                    >
                      Botão primário
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: config.corBotaoSecundario }}
                    >
                      Botão secundário
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
