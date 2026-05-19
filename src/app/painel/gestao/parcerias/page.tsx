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

export default function GestaoParceriasPage() {
  const { hasPermission } = useAuth();
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

  if (!canView) {
    return (
      <div className="p-8 text-sm text-gray-700">
        Você não tem permissão para visualizar parcerias.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Parcerias</h1>
        <input
          className="border rounded-md px-3 py-2 text-sm w-80 max-w-full"
          placeholder="Buscar"
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded ${aba === "vantagens" ? "bg-green-600 text-white" : "bg-gray-100"}`}
          onClick={() => setAba("vantagens")}
        >
          Vantagens
        </button>
        <button
          className={`px-3 py-2 rounded ${aba === "parceiros" ? "bg-green-600 text-white" : "bg-gray-100"}`}
          onClick={() => setAba("parceiros")}
        >
          Parceiros
        </button>
        <button
          className={`px-3 py-2 rounded ${aba === "categorias" ? "bg-green-600 text-white" : "bg-gray-100"}`}
          onClick={() => setAba("categorias")}
        >
          Categorias
        </button>
      </div>

      {aba === "categorias" && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          {canWrite && (
            <CategoriaForm
              onSave={async (payload) => {
                await salvarCategoriaAdmin(payload);
                await refetchCategorias();
              }}
            />
          )}
          <div className="divide-y">
            {categorias.map((c) => (
              <div key={c.id} className="py-2 text-sm">
                {c.nome} ({c.slug})
              </div>
            ))}
          </div>
        </section>
      )}

      {aba === "parceiros" && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          {canWrite && (
            <ParceiroForm
              onSave={async (payload) => {
                await salvarParceiroAdmin(payload);
                await refetchParceiros();
              }}
            />
          )}
          <div className="divide-y">
            {(
              parceiros as Array<{ id: number; nome: string; slug: string }>
            ).map((p) => (
              <div key={p.id} className="py-2 text-sm">
                {p.nome} ({p.slug})
              </div>
            ))}
          </div>
        </section>
      )}

      {aba === "vantagens" && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          {canWrite && (
            <VantagemForm
              categorias={categorias}
              parceiros={parceiros}
              onSave={async (payload) => {
                await salvarVantagemAdmin(payload);
                await refetchVantagens();
              }}
            />
          )}
          <div className="divide-y">
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
                <div>
                  <p className="text-sm font-medium">{v.titulo}</p>
                  <p className="text-xs text-gray-600">
                    {parceirosPorId[v.parceiroId] ?? "—"} •{" "}
                    {v.categoriaId != null
                      ? (categoriasPorId[v.categoriaId] ?? "Sem categoria")
                      : "Sem categoria"}{" "}
                    • {v.status}
                  </p>
                </div>
                {canDelete && (
                  <button
                    className="px-2 py-1 text-xs rounded bg-red-100 text-red-700"
                    onClick={async () => {
                      await excluirVantagemAdmin(v.id);
                      await refetchVantagens();
                    }}
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
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
      className="flex gap-2"
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (!nome.trim()) return;
        await onSave({ nome });
        setNome("");
      }}
    >
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="Nova categoria"
        value={nome}
        onChange={(ev) => setNome(ev.target.value)}
      />
      <button
        className="px-3 py-1 rounded bg-green-600 text-white text-sm"
        type="submit"
      >
        Salvar
      </button>
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
      className="grid sm:grid-cols-4 gap-2"
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (!nome.trim()) return;
        await onSave({ nome, cidade, uf });
        setNome("");
        setCidade("");
        setUf("");
      }}
    >
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="Nome do parceiro"
        value={nome}
        onChange={(ev) => setNome(ev.target.value)}
      />
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="Cidade"
        value={cidade}
        onChange={(ev) => setCidade(ev.target.value)}
      />
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="UF"
        maxLength={2}
        value={uf}
        onChange={(ev) => setUf(ev.target.value.toUpperCase())}
      />
      <button
        className="px-3 py-1 rounded bg-green-600 text-white text-sm"
        type="submit"
      >
        Salvar
      </button>
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
      className="grid sm:grid-cols-3 gap-2"
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
      <select
        className="border rounded px-2 py-1 text-sm"
        value={form.parceiroId}
        onChange={(ev) =>
          setForm((p) => ({ ...p, parceiroId: ev.target.value }))
        }
      >
        <option value="">Parceiro</option>
        {parceiros.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={form.categoriaId}
        onChange={(ev) =>
          setForm((p) => ({ ...p, categoriaId: ev.target.value }))
        }
      >
        <option value="">Categoria</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <input
        className="border rounded px-2 py-1 text-sm"
        placeholder="Título"
        value={form.titulo}
        onChange={(ev) => setForm((p) => ({ ...p, titulo: ev.target.value }))}
      />
      <input
        className="border rounded px-2 py-1 text-sm sm:col-span-2"
        placeholder="Descrição curta"
        value={form.descricaoCurta}
        onChange={(ev) =>
          setForm((p) => ({ ...p, descricaoCurta: ev.target.value }))
        }
      />
      <button
        className="px-3 py-1 rounded bg-green-600 text-white text-sm"
        type="submit"
      >
        Salvar vantagem
      </button>
    </form>
  );
}
