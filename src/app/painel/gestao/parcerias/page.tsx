"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  excluirVantagemAdmin,
  listarCategoriasAdmin,
  listarParceirosAdmin,
  listarVantagensAdmin,
  salvarCategoriaAdmin,
  salvarParceiroAdmin,
  salvarVantagemAdmin,
} from "@/services/parcerias.service";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Gift,
  HeartHandshake,
  Search,
  Tag,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function GestaoParceriasPage() {
  const { hasPermission, loading } = useAuth();
  const canView = hasPermission("parcerias.view");
  const canWrite =
    hasPermission("parcerias.create") || hasPermission("parcerias.update");
  const canDelete = hasPermission("parcerias.delete");

  const [aba, setAba] = useState<"vantagens" | "parceiros" | "categorias">(
    "vantagens",
  );
  const [q, setQ] = useState("");

  const { data: categorias = [], refetch: refetchCategorias } = useQuery({
    queryKey: ["parcerias", "admin", "categorias"],
    queryFn: listarCategoriasAdmin,
    enabled: canView,
  });
  const { data: parceiros = [], refetch: refetchParceiros } = useQuery({
    queryKey: ["parcerias", "admin", "parceiros", q],
    queryFn: () => listarParceirosAdmin(q),
    enabled: canView,
  });
  const { data: vantagens = [], refetch: refetchVantagens } = useQuery({
    queryKey: ["parcerias", "admin", "vantagens", q],
    queryFn: () => listarVantagensAdmin({ q }),
    enabled: canView,
  });

  const categoriasPorId = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.id, c.nome])),
    [categorias],
  );
  const parceirosPorId = useMemo(() => {
    const items = parceiros as Array<{ id: number; nome: string }>;
    return Object.fromEntries(items.map((p) => [p.id, p.nome]));
  }, [parceiros]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando...
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sem permissão</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Você não tem permissão para visualizar parcerias.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parcerias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie categorias, parceiros e vantagens exibidas aos clientes.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar"
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
          />
        </div>
      </div>

      <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
        <TabsList>
          <TabsTrigger value="vantagens">
            <Gift className="h-4 w-4" />
            Vantagens
          </TabsTrigger>
          <TabsTrigger value="parceiros">
            <HeartHandshake className="h-4 w-4" />
            Parceiros
          </TabsTrigger>
          <TabsTrigger value="categorias">
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {aba === "categorias" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canWrite && (
              <CategoriaForm
                onSave={async (payload) => {
                  await salvarCategoriaAdmin(payload);
                  await refetchCategorias();
                  toast.success("Categoria salva com sucesso");
                }}
              />
            )}
            {canWrite && <Separator />}
            {categorias.length === 0 ? (
              <EmptyState label="Nenhuma categoria cadastrada." />
            ) : (
              <div className="divide-y divide-slate-100">
                {categorias.map((c) => (
                  <div
                    key={c.id}
                    className="py-3 flex items-center gap-2 text-sm"
                  >
                    <span className="font-medium">{c.nome}</span>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {c.slug}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {aba === "parceiros" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parceiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canWrite && (
              <ParceiroForm
                onSave={async (payload) => {
                  await salvarParceiroAdmin(payload);
                  await refetchParceiros();
                  toast.success("Parceiro salvo com sucesso");
                }}
              />
            )}
            {canWrite && <Separator />}
            {parceiros.length === 0 ? (
              <EmptyState label="Nenhum parceiro cadastrado." />
            ) : (
              <div className="divide-y divide-slate-100">
                {(
                  parceiros as Array<{
                    id: number;
                    nome: string;
                    slug: string;
                  }>
                ).map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center gap-2 text-sm"
                  >
                    <span className="font-medium">{p.nome}</span>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {p.slug}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {aba === "vantagens" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vantagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canWrite && (
              <VantagemForm
                categorias={categorias}
                parceiros={parceiros}
                onSave={async (payload) => {
                  await salvarVantagemAdmin(payload);
                  await refetchVantagens();
                  toast.success("Vantagem salva com sucesso");
                }}
              />
            )}
            {canWrite && <Separator />}
            {vantagens.length === 0 ? (
              <EmptyState label="Nenhuma vantagem cadastrada." />
            ) : (
              <div className="divide-y divide-slate-100">
                {(
                  vantagens as Array<{
                    id: number;
                    titulo: string;
                    parceiroId: number;
                    categoriaId?: number | null;
                    status: string;
                  }>
                ).map((v) => (
                  <div
                    key={v.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{v.titulo}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{parceirosPorId[v.parceiroId] ?? "—"}</span>
                        <span>•</span>
                        <span>
                          {v.categoriaId != null
                            ? (categoriasPorId[v.categoriaId] ??
                              "Sem categoria")
                            : "Sem categoria"}
                        </span>
                        <Badge
                          variant={
                            v.status === "PUBLICADO" ? "default" : "outline"
                          }
                          className="text-[11px]"
                        >
                          {v.status}
                        </Badge>
                      </div>
                    </div>
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={async () => {
                          await excluirVantagemAdmin(v.id);
                          await refetchVantagens();
                          toast.success("Vantagem excluída");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground text-center py-6">{label}</p>
  );
}

function CategoriaForm({
  onSave,
}: {
  onSave: (payload: { nome: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (!nome.trim()) return;
        await onSave({ nome });
        setNome("");
      }}
    >
      <Input
        className="min-w-[240px] flex-1"
        placeholder="Nova categoria"
        value={nome}
        onChange={(ev) => setNome(ev.target.value)}
      />
      <Button type="submit">Salvar</Button>
    </form>
  );
}

function ParceiroForm({
  onSave,
}: {
  onSave: (payload: {
    nome: string;
    cidade: string;
    uf: string;
  }) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  return (
    <form
      className="grid gap-3 md:grid-cols-4"
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (!nome.trim()) return;
        await onSave({ nome, cidade, uf });
        setNome("");
        setCidade("");
        setUf("");
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label>Nome do parceiro</Label>
        <Input value={nome} onChange={(ev) => setNome(ev.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Cidade</Label>
        <Input value={cidade} onChange={(ev) => setCidade(ev.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>UF</Label>
        <Input
          maxLength={2}
          value={uf}
          onChange={(ev) => setUf(ev.target.value.toUpperCase())}
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          Salvar
        </Button>
      </div>
    </form>
  );
}

function VantagemForm({
  categorias,
  parceiros,
  onSave,
}: {
  categorias: Array<{ id: number; nome: string }>;
  parceiros: Array<{ id: number; nome: string }>;
  onSave: (payload: {
    parceiroId: number;
    categoriaId?: number;
    titulo: string;
    descricaoCurta: string;
    tipo: string;
    publico: string;
    status: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    parceiroId: "",
    categoriaId: "",
    titulo: "",
    descricaoCurta: "",
    tipo: "DESCONTO_PERCENTUAL",
    publico: "CLIENTES_ATIVOS",
    status: "PUBLICADO",
  });

  return (
    <form
      className="grid gap-3 md:grid-cols-3"
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (!form.titulo || !form.parceiroId) return;
        await onSave({
          ...form,
          parceiroId: Number(form.parceiroId),
          categoriaId: form.categoriaId ? Number(form.categoriaId) : undefined,
        });
        setForm({ ...form, titulo: "", descricaoCurta: "" });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label>Parceiro</Label>
        <Select
          value={form.parceiroId}
          onValueChange={(v) => setForm((p) => ({ ...p, parceiroId: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um parceiro" />
          </SelectTrigger>
          <SelectContent>
            {parceiros.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Categoria</Label>
        <Select
          value={form.categoriaId}
          onValueChange={(v) => setForm((p) => ({ ...p, categoriaId: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Título</Label>
        <Input
          value={form.titulo}
          onChange={(ev) => setForm((p) => ({ ...p, titulo: ev.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label>Descrição curta</Label>
        <Input
          value={form.descricaoCurta}
          onChange={(ev) =>
            setForm((p) => ({ ...p, descricaoCurta: ev.target.value }))
          }
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          Salvar vantagem
        </Button>
      </div>
    </form>
  );
}
