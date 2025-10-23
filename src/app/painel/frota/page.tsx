"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/Frota/Modal";
import VeiculoForm from "@/components/Frota/VeiculoForm";
import VeiculoTable from "@/components/Frota/VeiculoTable";
import ConfirmDelete from "@/components/Frota/ConfirmDelete";
import { Veiculo } from "@/types/VeiculoType";

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
      alert("Erro ao carregar dados dos veiculos");
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
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar dados dos veiculos");
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
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar dados ao atualizar");
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
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar dados ao excluir veiculos");
    } finally {
      setSaving(false);
      setSelectedIdToDelete(null);
    }
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestão de Frota</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setForm(emptyForm);
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
          >
            + Adicionar veículo
          </button>
          <button
            onClick={fetchVeiculos}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Atualizar
          </button>
        </div>
      </header>

      <VeiculoTable
        veiculos={veiculos}
        loading={loading}
        error={error}
        onEdit={(v) => {
          setForm(v);
          setIsEditOpen(true);
        }}
        onDelete={(id: React.SetStateAction<number | null>) => {
          setSelectedIdToDelete(id);
          setIsDeleteOpen(true);
        }}
      />

      {/* MODAL ADICIONAR */}
      {isAddOpen && (
        <Modal title="Adicionar veículo" onClose={() => setIsAddOpen(false)}>
          <VeiculoForm
            form={form}
            updateForm={updateForm}
            onSubmit={handleAddSubmit}
            saving={saving}
            onCancel={() => setIsAddOpen(false)}
            actionLabel="Criar"
          />
        </Modal>
      )}

      {/* MODAL EDITAR */}
      {isEditOpen && (
        <Modal title="Editar veículo" onClose={() => setIsEditOpen(false)}>
          <VeiculoForm
            form={form}
            updateForm={updateForm}
            onSubmit={handleEditSubmit}
            saving={saving}
            onCancel={() => setIsEditOpen(false)}
            actionLabel="Salvar"
          />
        </Modal>
      )}

      {/* MODAL EXCLUIR */}
      {isDeleteOpen && (
        <ConfirmDelete
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
          saving={saving}
        />
      )}
    </div>
  );
}
