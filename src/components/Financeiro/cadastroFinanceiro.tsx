"use client";

import React, { useMemo, useState } from "react";
import {
  Building2,
  Layers,
  CreditCard,
  Wallet,
  PlusCircle,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinanceiroCadastros } from "@/hooks/queries/useFinanceiroCadastros";
import {
  useCreateBancoFinanceiro,
  useDeleteBancoFinanceiro,
  useCreateTipoContabilFinanceiro,
  useDeleteTipoContabilFinanceiro,
  useCreateFormaPagamentoFinanceira,
  useDeleteFormaPagamentoFinanceira,
  useCreateCentroResultadoFinanceiro,
  useDeleteCentroResultadoFinanceiro,
} from "@/hooks/mutations/useCadastroFinanceiroMutations";
import type {
  BancoFinanceiro,
  TipoContabilFinanceiro,
  FormaPagamentoFinanceira,
  CentroResultadoFinanceiro,
} from "@/services/financeiro/cadastros.service";

type AbaAtiva = "banco" | "tipo" | "forma" | "centro";

type FormState = Partial<{
  nome: string;
  agencia: string;
  conta: string;
  saldo: string;
  descricao: string;
  natureza: string;
  prazo: string;
  orcamento: string;
}>;

const CadastroFinanceiro = () => {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("banco");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>({});

  const { data, isLoading, isError, error, refetch } = useFinanceiroCadastros();
  const createBanco = useCreateBancoFinanceiro();
  const deleteBanco = useDeleteBancoFinanceiro();
  const createTipo = useCreateTipoContabilFinanceiro();
  const deleteTipo = useDeleteTipoContabilFinanceiro();
  const createForma = useCreateFormaPagamentoFinanceira();
  const deleteForma = useDeleteFormaPagamentoFinanceira();
  const createCentro = useCreateCentroResultadoFinanceiro();
  const deleteCentro = useDeleteCentroResultadoFinanceiro();

  const bancos = data?.bancos ?? [];
  const tipos = data?.tiposContabeis ?? [];
  const formas = data?.formasPagamento ?? [];
  const centros = data?.centrosResultado ?? [];

  const isSubmitting = useMemo(() => {
    switch (abaAtiva) {
      case "banco":
        return createBanco.isPending;
      case "tipo":
        return createTipo.isPending;
      case "forma":
        return createForma.isPending;
      case "centro":
        return createCentro.isPending;
      default:
        return false;
    }
  }, [
    abaAtiva,
    createBanco.isPending,
    createTipo.isPending,
    createForma.isPending,
    createCentro.isPending,
  ]);

  const closeModal = () => {
    setShowModal(false);
    setForm({});
  };

  const handleSubmit = () => {
    switch (abaAtiva) {
      case "banco": {
        const payload = {
          nome: form.nome?.trim() ?? "",
          agencia: form.agencia?.trim() || undefined,
          conta: form.conta?.trim() || undefined,
          saldo: form.saldo ? Number(form.saldo) : undefined,
        };
        if (!payload.nome) return;
        createBanco.mutate(payload, {
          onSuccess: closeModal,
        });
        break;
      }
      case "tipo": {
        const payload = {
          descricao: form.descricao?.trim() ?? "",
          natureza: form.natureza?.trim() || undefined,
        };
        if (!payload.descricao) return;
        createTipo.mutate(payload, {
          onSuccess: closeModal,
        });
        break;
      }
      case "forma": {
        const payload = {
          nome: form.nome?.trim() ?? "",
          prazo: form.prazo?.trim() || undefined,
        };
        if (!payload.nome) return;
        createForma.mutate(payload, {
          onSuccess: closeModal,
        });
        break;
      }
      case "centro": {
        const payload = {
          nome: form.nome?.trim() ?? "",
          descricao: form.descricao?.trim() || undefined,
          orcamento: form.orcamento ? Number(form.orcamento) : undefined,
        };
        if (!payload.nome) return;
        createCentro.mutate(payload, {
          onSuccess: closeModal,
        });
        break;
      }
    }
  };

  const handleDelete = (tipo: AbaAtiva, id: number) => {
    switch (tipo) {
      case "banco":
        deleteBanco.mutate(id);
        break;
      case "tipo":
        deleteTipo.mutate(id);
        break;
      case "forma":
        deleteForma.mutate(id);
        break;
      case "centro":
        deleteCentro.mutate(id);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center space-y-4">
        <p className="text-gray-700">
          Não foi possível carregar os cadastros financeiros.
        </p>
        {error instanceof Error && (
          <p className="text-sm text-gray-500">{error.message}</p>
        )}
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Cadastros Financeiros Corporativos
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo</span>
        </button>
      </div>

      <div className="flex space-x-4 mb-6 border-b">
        {[
          { id: "banco", nome: "Bancos", icon: Building2 },
          { id: "tipo", nome: "Tipos Contábeis", icon: Layers },
          { id: "forma", nome: "Formas de Pagamento", icon: CreditCard },
          { id: "centro", nome: "Centros de Resultado", icon: Wallet },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as AbaAtiva)}
              className={`flex items-center space-x-2 py-2 px-3 border-b-2 ${
                abaAtiva === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.nome}</span>
            </button>
          );
        })}
      </div>

      <div>
        {abaAtiva === "banco" && (
          <TabelaBanco
            bancos={bancos}
            onDelete={(id) => handleDelete("banco", id)}
          />
        )}
        {abaAtiva === "tipo" && (
          <TabelaTipo
            tipos={tipos}
            onDelete={(id) => handleDelete("tipo", id)}
          />
        )}
        {abaAtiva === "forma" && (
          <TabelaForma
            formas={formas}
            onDelete={(id) => handleDelete("forma", id)}
          />
        )}
        {abaAtiva === "centro" && (
          <TabelaCentro
            centros={centros}
            onDelete={(id) => handleDelete("centro", id)}
          />
        )}
      </div>

      {showModal && (
        <ModalForm
          abaAtiva={abaAtiva}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

const ModalForm = ({
  abaAtiva,
  form,
  setForm,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  abaAtiva: AbaAtiva;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) => {
  const renderFields = () => {
    switch (abaAtiva) {
      case "banco":
        return (
          <>
            <InputField
              label="Nome do Banco"
              value={form.nome ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, nome: value }))
              }
            />
            <InputField
              label="Agência"
              value={form.agencia ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, agencia: value }))
              }
            />
            <InputField
              label="Conta"
              value={form.conta ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, conta: value }))
              }
            />
            <InputField
              label="Saldo Inicial"
              type="number"
              value={form.saldo ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, saldo: value }))
              }
            />
          </>
        );
      case "tipo":
        return (
          <>
            <InputField
              label="Descrição"
              value={form.descricao ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, descricao: value }))
              }
            />
            <InputField
              label="Natureza (Despesa ou Receita)"
              value={form.natureza ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, natureza: value }))
              }
            />
          </>
        );
      case "forma":
        return (
          <>
            <InputField
              label="Nome"
              value={form.nome ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, nome: value }))
              }
            />
            <InputField
              label="Prazo"
              value={form.prazo ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, prazo: value }))
              }
            />
          </>
        );
      case "centro":
        return (
          <>
            <InputField
              label="Nome"
              value={form.nome ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, nome: value }))
              }
            />
            <InputField
              label="Descrição"
              value={form.descricao ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, descricao: value }))
              }
            />
            <InputField
              label="Orçamento"
              type="number"
              value={form.orcamento ?? ""}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, orcamento: value }))
              }
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Novo cadastro</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">{renderFields()}</div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) => (
  <div className="flex flex-col space-y-1">
    <label className="text-sm text-gray-600">{label}</label>
    <Input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

const TabelaBanco = ({
  bancos,
  onDelete,
}: {
  bancos: BancoFinanceiro[];
  onDelete: (id: number) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="py-2">Banco</th>
          <th className="py-2">Agência</th>
          <th className="py-2">Conta</th>
          <th className="py-2">Saldo</th>
          <th className="py-2 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {bancos.map((banco) => (
          <tr key={banco.id} className="border-b">
            <td className="py-2">{banco.nome}</td>
            <td className="py-2">{banco.agencia || "—"}</td>
            <td className="py-2">{banco.conta || "—"}</td>
            <td className="py-2">
              R${" "}
              {banco.saldo.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </td>
            <td className="py-2 text-right">
              <button
                onClick={() => onDelete(banco.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
        {bancos.length === 0 && (
          <tr>
            <td colSpan={5} className="py-4 text-center text-gray-500">
              Nenhum banco cadastrado.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const TabelaTipo = ({
  tipos,
  onDelete,
}: {
  tipos: TipoContabilFinanceiro[];
  onDelete: (id: number) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="py-2">Descrição</th>
          <th className="py-2">Natureza</th>
          <th className="py-2 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {tipos.map((tipo) => (
          <tr key={tipo.id} className="border-b">
            <td className="py-2">{tipo.descricao}</td>
            <td className="py-2">{tipo.natureza || "—"}</td>
            <td className="py-2 text-right">
              <button
                onClick={() => onDelete(tipo.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
        {tipos.length === 0 && (
          <tr>
            <td colSpan={3} className="py-4 text-center text-gray-500">
              Nenhum tipo contábil cadastrado.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const TabelaForma = ({
  formas,
  onDelete,
}: {
  formas: FormaPagamentoFinanceira[];
  onDelete: (id: number) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="py-2">Nome</th>
          <th className="py-2">Prazo</th>
          <th className="py-2 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {formas.map((forma) => (
          <tr key={forma.id} className="border-b">
            <td className="py-2">{forma.nome}</td>
            <td className="py-2">{forma.prazo || "—"}</td>
            <td className="py-2 text-right">
              <button
                onClick={() => onDelete(forma.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
        {formas.length === 0 && (
          <tr>
            <td colSpan={3} className="py-4 text-center text-gray-500">
              Nenhuma forma de pagamento cadastrada.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const TabelaCentro = ({
  centros,
  onDelete,
}: {
  centros: CentroResultadoFinanceiro[];
  onDelete: (id: number) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="py-2">Nome</th>
          <th className="py-2">Descrição</th>
          <th className="py-2">Orçamento</th>
          <th className="py-2 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {centros.map((centro) => (
          <tr key={centro.id} className="border-b">
            <td className="py-2">{centro.nome}</td>
            <td className="py-2">{centro.descricao || "—"}</td>
            <td className="py-2">
              R${" "}
              {centro.orcamento.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </td>
            <td className="py-2 text-right">
              <button
                onClick={() => onDelete(centro.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
        {centros.length === 0 && (
          <tr>
            <td colSpan={4} className="py-4 text-center text-gray-500">
              Nenhum centro de resultado cadastrado.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default CadastroFinanceiro;
