"use client";
import React from "react";
import Modal from "./Modal";

export default function ConfirmDelete({
  onCancel,
  onConfirm,
  saving,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  return (
    <Modal title="Confirmar exclusão" onClose={onCancel}>
      <p>
        Tem certeza que deseja excluir este veículo? Essa ação não pode ser
        desfeita.
      </p>
      <div className="flex justify-end gap-2 pt-4">
        <button onClick={onCancel} className="px-4 py-2 border rounded">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={saving}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-60"
        >
          {saving ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </Modal>
  );
}
