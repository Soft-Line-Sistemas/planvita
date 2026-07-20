"use client";

import React, { useEffect, useMemo, useState } from "react";
import VeiculoForm from "@/components/Frota/VeiculoForm";
import VeiculoTable from "@/components/Frota/VeiculoTable";
import { Veiculo } from "@/types/VeiculoType";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Car, CheckCircle2, Plus, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";

export default function FrotaPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedIdToDelete, setSelectedIdToDelete] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState<Partial<Veiculo>>({});
  const [saving, setSaving] = useState(false);

  const emptyForm: Partial<Veiculo> = {
    placa: "",
    modelo: "",
    ano: new Date().getFullYear(),
    tipo: "",
    ativo: true,
    quilometragemAtual: undefined,
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  async function fetchVeiculos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/veiculos");
      if (!res.ok) throw new Error(`Erro ao buscar veículos: ${res.status}`);
      const data = await res.json();
      setVeiculos(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os veículos.");
      toast.error("Erro ao carregar dados dos veículos");
    } finally {
      setLoading(false);
    }
  }

  function updateForm<K extends keyof Veiculo>(
    key: K,
    value: Veiculo[K] | undefined,
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ====== Adicionar ======
  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        placa: form.placa,
        modelo: form.modelo,
        ano: Number(form.ano),
        tipo: form.tipo,
        ativo: Boolean(form.ativo),
        quilometragemAtual: form.quilometragemAtual ?? null,
      };

      const res = await fetch("/api/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Erro ao criar: ${res.status}`);

      await fetchVeiculos();
      setIsAddOpen(false);
      setForm(emptyForm);
      toast.success("Veículo cadastrado com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar veículo");
    } finally {
      setSaving(false);
    }
  }

  // ====== Editar ======
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/veiculos/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`Erro ao atualizar: ${res.status}`);
      await fetchVeiculos();
      setIsEditOpen(false);
      toast.success("Veículo atualizado com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar veículo");
    } finally {
      setSaving(false);
    }
  }

  // ====== Excluir ======
  async function handleDelete() {
    if (!selectedIdToDelete) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/veiculos/${selectedIdToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Erro ao excluir: ${res.status}`);
      await fetchVeiculos();
      setIsDeleteOpen(false);
      toast.success("Veículo excluído com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir veículo");
    } finally {
      setSaving(false);
      setSelectedIdToDelete(null);
    }
  }

  const totalAtivos = useMemo(
    () => veiculos.filter((v) => v.ativo).length,
    [veiculos],
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Frota</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre e acompanhe os veículos utilizados nos atendimentos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVeiculos} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setIsAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Adicionar veículo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#3a9b28] to-[#2d7a1f] flex items-center justify-center text-white flex-shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{veiculos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Veículos cadastrados
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{totalAtivos}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ativos na frota
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">
              {veiculos.length - totalAtivos}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Inativos</p>
          </div>
        </div>
      </div>

      <VeiculoTable
        veiculos={veiculos}
        loading={loading}
        error={error}
        onEdit={(v) => {
          setForm(v);
          setIsEditOpen(true);
        }}
        onDelete={(id: number) => {
          setSelectedIdToDelete(id);
          setIsDeleteOpen(true);
        }}
      />

      {/* MODAL ADICIONAR */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar veículo</DialogTitle>
            <DialogDescription>
              Preencha os dados do veículo que será incluído na frota.
            </DialogDescription>
          </DialogHeader>
          <VeiculoForm
            form={form}
            updateForm={updateForm}
            onSubmit={handleAddSubmit}
            saving={saving}
            onCancel={() => setIsAddOpen(false)}
            actionLabel="Criar"
          />
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar veículo</DialogTitle>
            <DialogDescription>
              Atualize os dados do veículo selecionado.
            </DialogDescription>
          </DialogHeader>
          <VeiculoForm
            form={form}
            updateForm={updateForm}
            onSubmit={handleEditSubmit}
            saving={saving}
            onCancel={() => setIsEditOpen(false)}
            actionLabel="Salvar"
          />
        </DialogContent>
      </Dialog>

      {/* MODAL EXCLUIR */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este veículo? Essa ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {saving ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
