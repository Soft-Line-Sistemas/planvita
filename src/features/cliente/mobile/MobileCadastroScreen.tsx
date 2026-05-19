"use client";

import "@/app/styles/cliente-mobile.css";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import {
  Barcode,
  CirclePlus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  Loader2,
  ShieldUser,
  QrCode,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
  dadosPessoaisSchema,
  enderecoSchema,
  responsavelFinanceiroSchema,
} from "@/components/Titular/schemas";
import { RELATIONSHIP_OPTIONS } from "@/constants/relationshipOptions";
import { BRAZIL_STATES, normalizeUfCode } from "@/constants/brazilStates";
import {
  formatCPF,
  formatPhone,
  formatWhatsApp,
  getWhatsAppFromPhone,
  formatRG,
  formatCEP,
} from "@/helpers/formHelpers";
import {
  calcularIdade,
  obterMaiorIdadeParticipantes,
  sanitizePlanoArray,
  selecionarPlanoPorMaiorIdade,
  type ParticipanteMin,
} from "@/utils/planos";
import {
  useCreateTitular,
  type CreateTitularInput,
} from "@/hooks/mutations/useCreateTitular";
import type { Dependente } from "@/types/DependentesType";
import type { Plano } from "@/types/PlanType";
import api from "@/utils/api";

/* ================================================================
   Types
   ================================================================ */

type Step1Values = z.infer<typeof dadosPessoaisSchema>;
type Step2Values = z.infer<typeof enderecoSchema>;
type Step3Values = z.infer<typeof responsavelFinanceiroSchema>;

interface DepErrors {
  nome?: string;
  dataNascimento?: string;
  parentesco?: string;
  telefone?: string;
  cpf?: string;
}

function validateSingleDependente(dep: Dependente): DepErrors {
  const err: DepErrors = {};
  if (!dep.nome?.trim()) err.nome = "Nome é obrigatório";
  if (!dep.dataNascimento)
    err.dataNascimento = "Data de nascimento é obrigatória";
  if (!dep.parentesco) err.parentesco = "Parentesco é obrigatório";
  if (!dep.telefone || dep.telefone.replace(/\D/g, "").length < 10)
    err.telefone = "Telefone inválido";
  if (!dep.cpf || dep.cpf.replace(/\D/g, "").length < 11)
    err.cpf = "CPF inválido";
  return err;
}

function isDependenteComplete(dep: Dependente): boolean {
  return Object.keys(validateSingleDependente(dep)).length === 0;
}

const DIRECT_PARENTESCOS_GRADE_FAMILIAR = new Set<string>([
  "Cônjuge",
  "Filho(a)",
  "Enteado(a)",
  "Pai",
  "Mãe",
  "Sogro(a)",
  "Neto(a)",
]);
const FALLBACK_VALOR_ADICIONAL_DEPENDENTE_FORA_GRADE = 14.9;

function formatAdicionalMensal(valor: number): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "R$ —";
  // Mantém o mesmo formato visual do new-ui: "R$ 19,90"
  const v = n.toFixed(2).replace(".", ",");
  return `R$ ${v}`;
}

function getAdicionalPillText(
  dep: Dependente,
  valorAdicionalDependenteForaGrade?: number | null,
): string | null {
  const parentesco = dep.parentesco?.trim();
  if (!parentesco) return null;

  const isDirectInGrade = DIRECT_PARENTESCOS_GRADE_FAMILIAR.has(parentesco);
  const foraGradeFamiliar = dep.foraGradeFamiliar ?? !isDirectInGrade;
  if (!foraGradeFamiliar) return null;
  if (dep.excluirCobrancaAdicional) return null;

  const valorRealDependente = Number(dep.valorAdicionalMensal ?? 0);
  const valorRegra = Number(valorAdicionalDependenteForaGrade ?? 0);
  const valor =
    valorRealDependente > 0
      ? valorRealDependente
      : valorRegra > 0
        ? valorRegra
        : FALLBACK_VALOR_ADICIONAL_DEPENDENTE_FORA_GRADE;

  const valorFmt = formatAdicionalMensal(valor);
  if (valorFmt === "R$ —") return "Adicional";

  return `Adicional: ${valorFmt}`;
}

interface ConsultorOption {
  id: number;
  nome: string;
}

type MetodoPagamento = "PIX" | "BOLETO" | "CARTAO";

const METODO_PAGAMENTO_LABELS: Record<MetodoPagamento, string> = {
  PIX: "PIX",
  BOLETO: "Boleto bancário",
  CARTAO: "Cartão de crédito",
};

const SERVICO_ADICIONAL_LABELS: Record<string, string> = {
  "clube-beneficios": "Clube de benefícios",
  telemedicina: "Telemedicina",
  pet: "Pet",
};

const BOSQUE_DEFAULT = "campo-do-bosque" as const;
const MAX_DEP = 8;

const STEPS = [
  { id: 1, title: "Titular" },
  { id: 2, title: "Endereço do titular" },
  { id: 3, title: "Responsável financeiro" },
  { id: 4, title: "Endereço do responsável" },
  { id: 5, title: "Dependentes" },
  { id: 6, title: "Planos" },
  { id: 7, title: "Forma de pagamento" },
  { id: 8, title: "Confirmação de cadastro" },
];

/* ================================================================
   Tiny helpers
   ================================================================ */

function Field({
  label,
  required,
  error,
  children,
  half,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  half?: boolean;
}) {
  return (
    <div className={`cm-cad-field${half ? " cm-cad-field-half" : ""}`}>
      <label className="cm-cad-label">
        {label}
        {required && <span className="cm-cad-required">*</span>}
      </label>
      {children}
      {error && <p className="cm-cad-error">{error}</p>}
    </div>
  );
}

function ErrBox({ message }: { message: string }) {
  return (
    <div className="cm-alert cm-alert-danger">
      <span>{message}</span>
    </div>
  );
}

function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

/** Cabeçalho de etapa alinhado ao new-ui (texto verde + ícone exportado do Figma). */
function CadastroSectionHead({
  iconSrc,
  iconWidth,
  iconHeight,
  title,
  description,
  centered,
}: {
  iconSrc: string;
  iconWidth?: number;
  iconHeight?: number;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  const w = iconWidth ?? 22;
  const h = iconHeight ?? 22;
  return (
    <>
      {description ? (
        <p
          className={`cm-cad-step-sub${centered ? " cm-cad-step-sub--center" : ""}`}
        >
          {description}
        </p>
      ) : null}
    </>
  );
}

const SITUACAO_OPTIONS = [
  "Solteiro(a)",
  "Casado(a)",
  "União estável",
  "Divorciado(a)",
  "Separado(a)",
  "Viúvo(a)",
];

/* ================================================================
   Step 1 – Dados Pessoais
   ================================================================ */

function Step1Form({ form }: { form: UseFormReturn<Step1Values> }) {
  const e = form.formState.errors;
  return (
    <>
      <Field label="Nome completo" required error={e.nomeCompleto?.message}>
        <input
          className={`cm-cad-input${e.nomeCompleto ? " error" : ""}`}
          maxLength={1000}
          placeholder="Seu nome completo"
          {...form.register("nomeCompleto")}
        />
      </Field>

      <div className="cm-cad-row-2">
        <Field label="CPF" required error={e.cpf?.message}>
          <input
            className={`cm-cad-input${e.cpf ? " error" : ""}`}
            maxLength={14}
            placeholder="000.000.000-00"
            inputMode="numeric"
            value={form.watch("cpf") || ""}
            onChange={(ev) => form.setValue("cpf", formatCPF(ev.target.value))}
          />
        </Field>

        <Field
          label="Data de nascimento"
          required
          error={e.dataNascimento?.message}
        >
          <input
            className={`cm-cad-input${e.dataNascimento ? " error" : ""}`}
            type="date"
            {...form.register("dataNascimento")}
          />
        </Field>
      </div>

      <div className="cm-cad-row-2">
        <Field label="Sexo" required error={e.sexo?.message?.toString()}>
          <select
            className={`cm-cad-select${e.sexo ? " error" : ""}`}
            value={form.watch("sexo") || ""}
            onChange={(ev) =>
              form.setValue("sexo", ev.target.value as "Masculino" | "Feminino")
            }
          >
            <option value="">Selecione</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </Field>

        <Field label="RG" error={e.rg?.message?.toString()}>
          <input
            className="cm-cad-input"
            maxLength={13}
            placeholder="RG (opcional)"
            value={form.watch("rg") || ""}
            onChange={(ev) => form.setValue("rg", formatRG(ev.target.value))}
          />
        </Field>
      </div>

      <Field
        label="Naturalidade"
        required
        error={e.naturalidade?.message?.toString()}
      >
        <input
          className={`cm-cad-input${e.naturalidade ? " error" : ""}`}
          maxLength={191}
          placeholder="Cidade onde nasceu"
          {...form.register("naturalidade")}
        />
      </Field>

      <Field
        label="Situação conjugal"
        required
        error={e.situacaoConjugal?.message?.toString()}
      >
        <select
          className={`cm-cad-select${e.situacaoConjugal ? " error" : ""}`}
          value={form.watch("situacaoConjugal") || ""}
          onChange={(ev) => form.setValue("situacaoConjugal", ev.target.value)}
        >
          <option value="">Selecione</option>
          {SITUACAO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Profissão"
        required
        error={e.profissao?.message?.toString()}
      >
        <input
          className={`cm-cad-input${e.profissao ? " error" : ""}`}
          maxLength={191}
          placeholder="Sua profissão"
          {...form.register("profissao")}
        />
      </Field>

      <div className="cm-cad-row-2">
        <Field
          label="Telefone"
          required
          error={e.telefone?.message?.toString()}
        >
          <input
            className={`cm-cad-input${e.telefone ? " error" : ""}`}
            maxLength={15}
            placeholder="(00) 00000-0000"
            inputMode="tel"
            value={form.watch("telefone") || ""}
            onChange={(ev) => {
              const raw = ev.target.value;
              form.setValue("telefone", formatPhone(raw));

              const digits = raw.replace(/\D/g, "");
              const isCompletePhone =
                digits.length === 11 ||
                (digits.length === 10 && digits[2] !== "9");

              if (isCompletePhone) {
                const whatsapp = getWhatsAppFromPhone(raw);
                if (whatsapp) {
                  form.setValue("whatsapp", whatsapp);
                }
              }
            }}
            onBlur={() => {
              const whatsapp = getWhatsAppFromPhone(
                form.watch("telefone") || "",
              );
              if (whatsapp) {
                form.setValue("whatsapp", whatsapp);
              }
            }}
          />
        </Field>

        <Field
          label="WhatsApp"
          required
          error={e.whatsapp?.message?.toString()}
        >
          <input
            className={`cm-cad-input${e.whatsapp ? " error" : ""}`}
            maxLength={15}
            placeholder="(00) 00000-0000"
            inputMode="tel"
            value={form.watch("whatsapp") || ""}
            onChange={(ev) =>
              form.setValue("whatsapp", formatWhatsApp(ev.target.value))
            }
          />
        </Field>
      </div>

      <Field label="E-mail" required error={e.email?.message?.toString()}>
        <input
          className={`cm-cad-input${e.email ? " error" : ""}`}
          type="email"
          maxLength={1000}
          inputMode="email"
          placeholder="seu@email.com"
          {...form.register("email")}
        />
      </Field>
    </>
  );
}

/* ================================================================
   Step 2 – Endereço
   ================================================================ */

function Step2Form({
  form,
  ufValue,
}: {
  form: UseFormReturn<Step2Values>;
  ufValue: string;
}) {
  const e = form.formState.errors;
  return (
    <>
      <div className="cm-cad-row-2">
        <Field label="CEP" required error={e.cep?.message?.toString()}>
          <input
            className={`cm-cad-input${e.cep ? " error" : ""}`}
            maxLength={9}
            placeholder="00000-000"
            inputMode="numeric"
            value={form.watch("cep") || ""}
            onChange={(ev) => form.setValue("cep", formatCEP(ev.target.value))}
          />
        </Field>

        <Field label="UF" required error={e.uf?.message?.toString()}>
          <select
            className={`cm-cad-select${e.uf ? " error" : ""}`}
            value={ufValue}
            onChange={(ev) => form.setValue("uf", ev.target.value)}
          >
            <option value="">UF</option>
            {BRAZIL_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Cidade" required error={e.cidade?.message?.toString()}>
        <input
          className={`cm-cad-input${e.cidade ? " error" : ""}`}
          maxLength={1000}
          placeholder="Cidade"
          {...form.register("cidade")}
        />
      </Field>

      <Field label="Bairro" required error={e.bairro?.message?.toString()}>
        <input
          className={`cm-cad-input${e.bairro ? " error" : ""}`}
          maxLength={1000}
          placeholder="Bairro"
          {...form.register("bairro")}
        />
      </Field>

      <div className="cm-cad-row-street">
        <Field
          label="Rua / Logradouro"
          required
          error={e.logradouro?.message?.toString()}
        >
          <input
            className={`cm-cad-input${e.logradouro ? " error" : ""}`}
            maxLength={1000}
            placeholder="Nome da rua"
            {...form.register("logradouro")}
          />
        </Field>

        <Field label="Número" required error={e.numero?.message?.toString()}>
          <input
            className={`cm-cad-input${e.numero ? " error" : ""}`}
            maxLength={1000}
            placeholder="Nº"
            {...form.register("numero")}
          />
        </Field>
      </div>

      <Field label="Complemento" error={undefined}>
        <input
          className="cm-cad-input"
          maxLength={1000}
          placeholder="Apto, bloco… (opcional)"
          {...form.register("complemento")}
        />
      </Field>

      <Field
        label="Ponto de referência"
        required
        error={e.pontoReferencia?.message?.toString()}
      >
        <input
          className={`cm-cad-input${e.pontoReferencia ? " error" : ""}`}
          maxLength={255}
          placeholder="Próximo a…"
          {...form.register("pontoReferencia")}
        />
      </Field>
    </>
  );
}

/* ================================================================
   Step 3 – Responsável Financeiro
   ================================================================ */

function Step3Form({
  form,
  usarMesmosDados,
}: {
  form: UseFormReturn<Step3Values>;
  usarMesmosDados: boolean;
}) {
  const e = form.formState.errors;

  return (
    <>
      {!usarMesmosDados && (
        <>
          <Field
            label="Nome completo"
            required
            error={e.nomeCompleto?.message?.toString()}
          >
            <input
              className={`cm-cad-input${e.nomeCompleto ? " error" : ""}`}
              maxLength={1000}
              placeholder="Nome do responsável"
              {...form.register("nomeCompleto")}
            />
          </Field>

          <div className="cm-cad-row-2">
            <Field label="CPF" required error={e.cpf?.message?.toString()}>
              <input
                className={`cm-cad-input${e.cpf ? " error" : ""}`}
                maxLength={14}
                placeholder="000.000.000-00"
                inputMode="numeric"
                value={form.watch("cpf") || ""}
                onChange={(ev) =>
                  form.setValue("cpf", formatCPF(ev.target.value))
                }
              />
            </Field>

            <Field label="RG">
              <input
                className="cm-cad-input"
                maxLength={13}
                placeholder="RG (opcional)"
                value={form.watch("rg") || ""}
                onChange={(ev) =>
                  form.setValue("rg", formatRG(ev.target.value))
                }
              />
            </Field>
          </div>

          <div className="cm-cad-row-2">
            <Field
              label="Data de nascimento"
              required
              error={e.dataNascimento?.message?.toString()}
            >
              <input
                className={`cm-cad-input${e.dataNascimento ? " error" : ""}`}
                type="date"
                {...form.register("dataNascimento")}
              />
            </Field>

            <Field
              label="Parentesco"
              required
              error={e.parentesco?.message?.toString()}
            >
              <select
                className={`cm-cad-select${e.parentesco ? " error" : ""}`}
                value={form.watch("parentesco") || ""}
                onChange={(ev) => form.setValue("parentesco", ev.target.value)}
              >
                <option value="">Selecione</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="cm-cad-row-2">
            <Field label="Sexo" required error={e.sexo?.message?.toString()}>
              <select
                className={`cm-cad-select${e.sexo ? " error" : ""}`}
                value={form.watch("sexo") || ""}
                onChange={(ev) => form.setValue("sexo", ev.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </Field>

            <Field
              label="Naturalidade"
              required
              error={e.naturalidade?.message?.toString()}
            >
              <input
                className={`cm-cad-input${e.naturalidade ? " error" : ""}`}
                maxLength={191}
                placeholder="Cidade"
                {...form.register("naturalidade")}
              />
            </Field>
          </div>

          <Field
            label="Situação conjugal"
            required
            error={e.situacaoConjugal?.message?.toString()}
          >
            <select
              className={`cm-cad-select${e.situacaoConjugal ? " error" : ""}`}
              value={form.watch("situacaoConjugal") || ""}
              onChange={(ev) =>
                form.setValue("situacaoConjugal", ev.target.value)
              }
            >
              <option value="">Selecione</option>
              {SITUACAO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Profissão"
            required
            error={e.profissao?.message?.toString()}
          >
            <input
              className={`cm-cad-input${e.profissao ? " error" : ""}`}
              maxLength={191}
              placeholder="Profissão"
              {...form.register("profissao")}
            />
          </Field>

          <p className="cm-cad-section">Contato do Responsável</p>

          <Field label="E-mail" required error={e.email?.message?.toString()}>
            <input
              className={`cm-cad-input${e.email ? " error" : ""}`}
              type="email"
              maxLength={1000}
              inputMode="email"
              placeholder="responsavel@email.com"
              {...form.register("email")}
            />
          </Field>

          <div className="cm-cad-row-2">
            <Field
              label="Telefone"
              required
              error={e.telefone?.message?.toString()}
            >
              <input
                className={`cm-cad-input${e.telefone ? " error" : ""}`}
                maxLength={15}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                value={form.watch("telefone") || ""}
                onChange={(ev) => {
                  const raw = ev.target.value;
                  form.setValue("telefone", formatPhone(raw));

                  const digits = raw.replace(/\D/g, "");
                  const isCompletePhone =
                    digits.length === 11 ||
                    (digits.length === 10 && digits[2] !== "9");

                  if (isCompletePhone) {
                    const whatsapp = getWhatsAppFromPhone(raw);
                    if (whatsapp) {
                      form.setValue("whatsapp", whatsapp);
                    }
                  }
                }}
                onBlur={() => {
                  const whatsapp = getWhatsAppFromPhone(
                    form.watch("telefone") || "",
                  );
                  if (whatsapp) {
                    form.setValue("whatsapp", whatsapp);
                  }
                }}
              />
            </Field>

            <Field
              label="WhatsApp"
              required
              error={e.whatsapp?.message?.toString()}
            >
              <input
                className={`cm-cad-input${e.whatsapp ? " error" : ""}`}
                maxLength={15}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                value={form.watch("whatsapp") || ""}
                onChange={(ev) =>
                  form.setValue("whatsapp", formatWhatsApp(ev.target.value))
                }
              />
            </Field>
          </div>
        </>
      )}
    </>
  );
}

/* ================================================================
   Step 4 – Endereço do Responsável
   ================================================================ */

function Step4AddressForm({
  form,
  ufValue,
}: {
  form: UseFormReturn<Step3Values>;
  ufValue: string;
}) {
  const e = form.formState.errors;

  return (
    <>
      <div className="cm-cad-row-2">
        <Field label="CEP" required error={e.cep?.message?.toString()}>
          <input
            className={`cm-cad-input${e.cep ? " error" : ""}`}
            maxLength={9}
            placeholder="00000-000"
            inputMode="numeric"
            value={form.watch("cep") || ""}
            onChange={(ev) => form.setValue("cep", formatCEP(ev.target.value))}
          />
        </Field>

        <Field label="UF" required error={e.uf?.message?.toString()}>
          <select
            className={`cm-cad-select${e.uf ? " error" : ""}`}
            value={ufValue}
            onChange={(ev) => form.setValue("uf", ev.target.value)}
          >
            <option value="">UF</option>
            {BRAZIL_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Cidade" required error={e.cidade?.message?.toString()}>
        <input
          className={`cm-cad-input${e.cidade ? " error" : ""}`}
          maxLength={191}
          placeholder="Cidade"
          {...form.register("cidade")}
        />
      </Field>

      <Field label="Bairro" required error={e.bairro?.message?.toString()}>
        <input
          className={`cm-cad-input${e.bairro ? " error" : ""}`}
          maxLength={191}
          placeholder="Bairro"
          {...form.register("bairro")}
        />
      </Field>

      <div className="cm-cad-row-street">
        <Field label="Rua" required error={e.logradouro?.message?.toString()}>
          <input
            className={`cm-cad-input${e.logradouro ? " error" : ""}`}
            maxLength={191}
            placeholder="Logradouro"
            {...form.register("logradouro")}
          />
        </Field>

        <Field label="Número" required error={e.numero?.message?.toString()}>
          <input
            className={`cm-cad-input${e.numero ? " error" : ""}`}
            maxLength={50}
            placeholder="Nº"
            {...form.register("numero")}
          />
        </Field>
      </div>

      <Field label="Complemento">
        <input
          className="cm-cad-input"
          maxLength={191}
          placeholder="Opcional"
          {...form.register("complemento")}
        />
      </Field>

      <Field
        label="Ponto de referência"
        required
        error={e.pontoReferencia?.message?.toString()}
      >
        <input
          className={`cm-cad-input${e.pontoReferencia ? " error" : ""}`}
          maxLength={255}
          placeholder="Próximo a…"
          {...form.register("pontoReferencia")}
        />
      </Field>
    </>
  );
}

/* ================================================================
   Step 5 – Dependentes: formulário até Confirmar; card resumo new-ui após confirmado (edição via lápis).
   ================================================================ */

function Step4Form({
  dependentes,
  errors,
  onChange,
  onFieldEdited,
  limiteBeneficiarios,
  editingDepIndex,
  onEditingDepIndexChange,
  depConfirmados,
  onConfirmDependent,
  onDepAdded,
  onDepRemoved,
  onInvalidateDepConfirm,
  valorAdicionalDependenteForaGrade,
}: {
  dependentes: Dependente[];
  errors: DepErrors[];
  onChange: (deps: Dependente[]) => void;
  onFieldEdited: (idx: number, field: keyof DepErrors) => void;
  limiteBeneficiarios: number;
  editingDepIndex: number | null;
  onEditingDepIndexChange: (idx: number | null) => void;
  depConfirmados: boolean[];
  onConfirmDependent: (idx: number) => void;
  onDepAdded: () => void;
  onDepRemoved: (idx: number) => void;
  onInvalidateDepConfirm: (idx: number) => void;
  valorAdicionalDependenteForaGrade?: number | null;
}) {
  const canAdd = dependentes.length < limiteBeneficiarios;
  const [depModalIndex, setDepModalIndex] = useState<number | null>(null);
  const [depModalAdded, setDepModalAdded] = useState(false);
  const [depInfoModalOpen, setDepInfoModalOpen] = useState(false);

  const handleAdd = () => {
    if (!canAdd) return;
    const next = [
      ...dependentes,
      {
        nome: "",
        idade: null,
        dataNascimento: null,
        parentesco: "",
        telefone: "",
        cpf: "",
      },
    ];
    onChange(next);
    onDepAdded();
    setDepModalAdded(true);
    setDepModalIndex(next.length - 1);
  };

  const handleRemove = (idx: number) => {
    const filtered = dependentes.filter((_, i) => i !== idx);
    onChange(filtered);
    onDepRemoved(idx);
    if (editingDepIndex === idx) {
      onEditingDepIndexChange(null);
    } else if (editingDepIndex !== null && editingDepIndex > idx) {
      onEditingDepIndexChange(editingDepIndex - 1);
    }
  };

  const handleChange = <K extends keyof Dependente & keyof DepErrors>(
    idx: number,
    field: K,
    value: Dependente[K],
  ) => {
    const updated = [...dependentes];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "dataNascimento") {
      const dn = value as string | null;
      updated[idx].idade = dn ? calcularIdade(dn) : null;
    }
    if (depConfirmados[idx]) {
      onInvalidateDepConfirm(idx);
    }
    onChange(updated);
    onFieldEdited(idx, field);
  };

  const resumoIdade = (dep: Dependente) => {
    if (dep.idade != null) return `${dep.idade} anos`;
    if (dep.dataNascimento) return `${calcularIdade(dep.dataNascimento)} anos`;
    return "—";
  };

  const getDepTipo = (dep: Dependente): "Direto" | "Indireto" | "Outros" => {
    const parentesco = dep.parentesco?.trim();
    if (!parentesco) return "Indireto";
    if (parentesco.toLowerCase() === "outro") return "Outros";
    return DIRECT_PARENTESCOS_GRADE_FAMILIAR.has(parentesco)
      ? "Direto"
      : "Indireto";
  };

  const getDepAdicionalValor = (dep: Dependente): number => {
    const parentesco = dep.parentesco?.trim();
    if (!parentesco) return FALLBACK_VALOR_ADICIONAL_DEPENDENTE_FORA_GRADE;
    const isDirectInGrade = DIRECT_PARENTESCOS_GRADE_FAMILIAR.has(parentesco);
    const foraGradeFamiliar = dep.foraGradeFamiliar ?? !isDirectInGrade;
    if (!foraGradeFamiliar || dep.excluirCobrancaAdicional) return 0;
    const valorRealDependente = Number(dep.valorAdicionalMensal ?? 0);
    const valorRegra = Number(valorAdicionalDependenteForaGrade ?? 0);
    if (valorRealDependente > 0) return valorRealDependente;
    if (valorRegra > 0) return valorRegra;
    return FALLBACK_VALOR_ADICIONAL_DEPENDENTE_FORA_GRADE;
  };

  useEffect(() => {
    if (editingDepIndex == null) return;
    if (depModalAdded && depModalIndex === editingDepIndex) return;
    setDepModalIndex(editingDepIndex);
    setDepModalAdded(false);
  }, [editingDepIndex, depModalAdded, depModalIndex]);

  useEffect(() => {
    if (
      (depModalIndex == null && !depInfoModalOpen) ||
      typeof document === "undefined"
    ) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [depModalIndex, depInfoModalOpen]);

  const closeDepModal = () => {
    if (
      depModalAdded &&
      depModalIndex != null &&
      dependentes[depModalIndex] &&
      depConfirmados[depModalIndex] !== true
    ) {
      const filtered = dependentes.filter((_, i) => i !== depModalIndex);
      onChange(filtered);
      onDepRemoved(depModalIndex);
    }
    setDepModalIndex(null);
    setDepModalAdded(false);
    onEditingDepIndexChange(null);
  };

  const confirmDepModal = () => {
    if (depModalIndex == null) return;
    const err = validateSingleDependente(dependentes[depModalIndex]);
    onConfirmDependent(depModalIndex);
    if (Object.keys(err).length === 0) {
      setDepModalIndex(null);
      setDepModalAdded(false);
      onEditingDepIndexChange(null);
    }
  };

  return (
    <div className="cm-cad-dep-screen">
      <div className="cm-cad-dep-add-wrap">
        <button
          type="button"
          className="cm-cad-dep-add-figma"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          <CirclePlus size={18} strokeWidth={2.2} aria-hidden />
          <span>Adicionar</span>
        </button>
      </div>

      {dependentes.length > 0 ? (
        <div className="cm-cad-dep-count-bar" role="status">
          <Image
            src="/cliente-mobile/Vector-29.svg"
            alt=""
            width={22}
            height={22}
            className="cm-cad-dep-count-bar-icon"
            aria-hidden
          />
          <span className="cm-cad-dep-count-bar-text">
            Dependentes ({dependentes.length})
          </span>
        </div>
      ) : null}

      {dependentes.map((dep, idx) => {
        const adicionalTexto = getAdicionalPillText(
          dep,
          valorAdicionalDependenteForaGrade,
        );
        return (
          <div key={idx} className="cm-cad-dep-resumo-card">
            <div className="cm-cad-dep-resumo-main">
              <p className="cm-cad-dep-resumo-name">{dep.nome.trim()}</p>
              <p className="cm-cad-dep-resumo-line">
                Parentesco: {dep.parentesco?.trim() || "—"}
              </p>
              <p className="cm-cad-dep-resumo-line">
                Idade: {resumoIdade(dep)}
              </p>
              <p className="cm-cad-dep-resumo-line">
                Data Nascimento: {formatDateBR(dep.dataNascimento)}
              </p>
              {adicionalTexto ? (
                <div className="cm-cad-dep-adicional-pill">
                  {adicionalTexto}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="cm-cad-dep-pencil-btn"
              onClick={() => {
                setDepModalAdded(false);
                setDepModalIndex(idx);
              }}
              aria-label={`Editar dependente ${idx + 1}`}
            >
              <Image
                src="/cliente-mobile/Vector-17.svg"
                alt=""
                width={27}
                height={27}
                aria-hidden
              />
            </button>
          </div>
        );
      })}

      {!canAdd ? (
        <p className="cm-cad-error cm-cad-dep-limit-msg">
          Limite de {limiteBeneficiarios} dependente(s) atingido.
        </p>
      ) : null}

      {depModalIndex != null &&
      dependentes[depModalIndex] &&
      typeof document !== "undefined"
        ? createPortal(
            <div
              className="cm-cad-dep-modal-overlay"
              role="presentation"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0, 0, 0, 0.44)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "24vh 18px 0",
              }}
            >
              <div
                className="cm-cad-dep-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dep-modal-title"
                style={{
                  width: "min(396px, 100%)",
                  maxHeight: "72dvh",
                  overflowY: "auto",
                  borderRadius: "22px",
                  background: "#ffffff",
                  padding: "36px 16px 22px",
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  className="cm-cad-dep-modal-close"
                  onClick={closeDepModal}
                  aria-label="Fechar"
                >
                  <Image
                    src="/cliente-mobile/Vector-39.svg"
                    alt=""
                    width={31}
                    height={31}
                    aria-hidden
                  />
                </button>

                <div className="cm-cad-dep-modal-heading">
                  <h3 id="dep-modal-title">Dependente {depModalIndex + 1}</h3>
                </div>

                <div className="cm-cad-dep-modal-form">
                  <Field
                    label="Nome"
                    required
                    error={(errors[depModalIndex] ?? {}).nome}
                  >
                    <input
                      className={`cm-cad-input${(errors[depModalIndex] ?? {}).nome ? " error" : ""}`}
                      maxLength={1000}
                      value={dependentes[depModalIndex].nome}
                      onChange={(ev) =>
                        handleChange(depModalIndex, "nome", ev.target.value)
                      }
                    />
                  </Field>

                  <div className="cm-cad-dep-modal-row">
                    <Field
                      label="Data de nascimento"
                      required
                      error={(errors[depModalIndex] ?? {}).dataNascimento}
                    >
                      <input
                        className={`cm-cad-input${(errors[depModalIndex] ?? {}).dataNascimento ? " error" : ""}`}
                        type="date"
                        value={dependentes[depModalIndex].dataNascimento ?? ""}
                        onChange={(ev) =>
                          handleChange(
                            depModalIndex,
                            "dataNascimento",
                            ev.target.value || null,
                          )
                        }
                      />
                    </Field>

                    <Field
                      label="Parentesco"
                      required
                      error={(errors[depModalIndex] ?? {}).parentesco}
                    >
                      <select
                        className={`cm-cad-select${(errors[depModalIndex] ?? {}).parentesco ? " error" : ""}`}
                        value={dependentes[depModalIndex].parentesco || ""}
                        onChange={(ev) =>
                          handleChange(
                            depModalIndex,
                            "parentesco",
                            ev.target.value,
                          )
                        }
                      >
                        <option value="">Selecione</option>
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Tipo">
                    <div className="cm-cad-dep-tipo-wrap" aria-live="polite">
                      <input
                        className="cm-cad-input cm-cad-dep-tipo-input"
                        value={getDepTipo(dependentes[depModalIndex])}
                        readOnly
                      />
                      <span className="cm-cad-dep-tipo-adicional">
                        {`Adicional: ${formatAdicionalMensal(getDepAdicionalValor(dependentes[depModalIndex]))}`}
                      </span>
                    </div>
                  </Field>

                  <button
                    type="button"
                    className="cm-cad-dep-info-link"
                    onClick={() => setDepInfoModalOpen(true)}
                  >
                    <Image
                      src="/cliente-mobile/Vector-40.svg"
                      alt=""
                      width={17}
                      height={17}
                      aria-hidden
                    />
                    <span>Clique aqui para entender o valor adicional</span>
                  </button>

                  <div className="cm-cad-dep-modal-row">
                    <Field
                      label="Telefone"
                      required
                      error={(errors[depModalIndex] ?? {}).telefone}
                    >
                      <input
                        className={`cm-cad-input${(errors[depModalIndex] ?? {}).telefone ? " error" : ""}`}
                        maxLength={15}
                        inputMode="tel"
                        value={dependentes[depModalIndex].telefone}
                        onChange={(ev) =>
                          handleChange(
                            depModalIndex,
                            "telefone",
                            formatPhone(ev.target.value),
                          )
                        }
                      />
                    </Field>

                    <Field
                      label="CPF"
                      required
                      error={(errors[depModalIndex] ?? {}).cpf}
                    >
                      <input
                        className={`cm-cad-input${(errors[depModalIndex] ?? {}).cpf ? " error" : ""}`}
                        maxLength={14}
                        inputMode="numeric"
                        value={dependentes[depModalIndex].cpf}
                        onChange={(ev) =>
                          handleChange(
                            depModalIndex,
                            "cpf",
                            formatCPF(ev.target.value),
                          )
                        }
                      />
                    </Field>
                  </div>

                  <div className="cm-cad-dep-modal-actions">
                    <button
                      type="button"
                      className="cm-cad-dep-confirm-btn"
                      onClick={confirmDepModal}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      className="cm-cad-dep-modal-remove"
                      onClick={() => {
                        handleRemove(depModalIndex);
                        setDepModalIndex(null);
                        setDepModalAdded(false);
                        onEditingDepIndexChange(null);
                      }}
                    >
                      Remover dependente
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {depInfoModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="cm-cad-dep-info-modal-overlay"
              role="presentation"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                background: "rgba(0, 0, 0, 0.44)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "14vh 18px 0",
              }}
            >
              <div
                className="cm-cad-dep-info-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dep-info-modal-title"
                style={{
                  width: "min(396px, 100%)",
                  maxHeight: "74dvh",
                  overflowY: "auto",
                  borderRadius: "20px",
                  background: "#ffffff",
                  padding: "18px 18px 18px",
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  className="cm-cad-dep-modal-close"
                  onClick={() => setDepInfoModalOpen(false)}
                  aria-label="Fechar"
                >
                  <Image
                    src="/cliente-mobile/Vector-39.svg"
                    alt=""
                    width={31}
                    height={31}
                    aria-hidden
                  />
                </button>

                <h3 id="dep-info-modal-title" className="cm-cad-dep-info-title">
                  Base de agregados
                </h3>

                <div className="cm-cad-dep-info-sections">
                  <section className="cm-cad-dep-info-box">
                    <strong>Dependentes Diretos</strong>
                    <p>
                      Titular, cônjuge ou companheiro(a), filhos, enteados,
                      netos, pais e sogros. Já incluídos na grade familiar do
                      plano.
                    </p>
                  </section>
                  <section className="cm-cad-dep-info-box">
                    <strong>Dependentes Indiretos</strong>
                    <p>
                      Sobrinhos, tios, irmãos, avós, cunhados, entre outros.
                    </p>
                    <span>*R$ 9,90 por pessoa (até 60 anos)</span>
                  </section>
                  <section className="cm-cad-dep-info-box">
                    <strong>Outros</strong>
                    <p>Pessoas sem grau de parentesco com o titular.</p>
                    <span>*R$ 14,90 por pessoa (até 70 anos)</span>
                  </section>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/* ================================================================
   Step 5 – Plano
   ================================================================ */

function Step5Plano({
  planos,
  isLoading,
  selected,
  onSelect,
  error,
  selectionLocked,
}: {
  planos: Plano[];
  isLoading: boolean;
  selected: Plano | null;
  onSelect: (p: Plano) => void;
  error: string | null;
  selectionLocked: boolean;
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);
  const getPlanoHighlights = (
    plano: Plano,
  ): Array<{ id: string; text: string }> => {
    if (Array.isArray(plano.coberturas) && plano.coberturas.length > 0) {
      return plano.coberturas
        .map((item) => ({
          id: `cobertura-${item.id}`,
          text: String(item.descricao ?? "").trim(),
        }))
        .filter((item) => item.text.length > 0);
    }

    if (Array.isArray(plano.beneficios) && plano.beneficios.length > 0) {
      return plano.beneficios
        .map((item) => {
          const nome = String(item.nome ?? "").trim();
          const descricao = String(item.descricao ?? "").trim();
          const text = descricao ? `${nome}: ${descricao}` : nome;
          return {
            id: `beneficio-${item.id}`,
            text,
          };
        })
        .filter((item) => item.text.length > 0);
    }

    return [];
  };

  if (isLoading) {
    return (
      <>
        <CadastroSectionHead
          iconSrc="/cliente-mobile/Vector-7.svg"
          iconWidth={31}
          iconHeight={38}
          title="Planos"
          description="Escolha o plano que melhor atende você e sua família."
        />
        <div className="cm-cad-plan-loading">
          <Loader2 size={28} className="cm-spinner" aria-hidden />
          <p>Carregando planos…</p>
        </div>
      </>
    );
  }

  if (planos.length === 0) {
    return (
      <>
        <CadastroSectionHead
          iconSrc="/cliente-mobile/Vector-7.svg"
          iconWidth={31}
          iconHeight={38}
          title="Planos"
          description="Escolha o plano que melhor atende você e sua família."
        />
        <div className="cm-cad-plan-empty">
          Nenhum plano disponível no momento.
        </div>
      </>
    );
  }

  return (
    <>
      {error && <ErrBox message={error} />}

      <CadastroSectionHead
        iconSrc="/cliente-mobile/Vector-7.svg"
        iconWidth={31}
        iconHeight={38}
        title="Planos"
        description="Escolha o plano que melhor atende você e sua família."
      />

      <div className="cm-cad-plan-highlight">
        <span>Plano selecionado para seu perfil</span>
      </div>

      {planos.map((plano) => {
        const isSelected = selected?.id === plano.id;
        const isDisabled = selectionLocked && !isSelected;
        const highlights = getPlanoHighlights(plano);
        return (
          <button
            key={plano.id}
            type="button"
            className={`cm-cad-plan-card${isSelected ? " selected" : ""}${isDisabled ? " disabled" : ""}`}
            onClick={() => {
              if (isDisabled) return;
              onSelect(plano);
            }}
            disabled={isDisabled}
          >
            <div className="cm-cad-plan-top">
              <div
                className={`cm-cad-plan-radio${isSelected ? " selected" : ""}`}
                style={{ marginTop: 3 }}
              >
                {isSelected && <div className="cm-cad-plan-radio-dot" />}
              </div>
              <div className="cm-cad-plan-main">
                <p className="cm-cad-plan-name">{plano.nome}</p>
                <p className="cm-cad-plan-subtitle">
                  {plano.idadeMaxima
                    ? `Idade máxima: ${plano.idadeMaxima} anos`
                    : "Sem limite de idade"}
                </p>
              </div>
              <div className="cm-cad-plan-price-badge">
                <p className="cm-cad-plan-price">{fmt(plano.valorMensal)}</p>
              </div>
            </div>

            {highlights.length > 0 && (
              <>
                <p className="cm-cad-plan-block-title">Coberturas</p>
                <div className="cm-cad-plan-description">
                  {highlights.map((item) => (
                    <div key={item.id} className="cm-cad-plan-bullet-line">
                      <span className="cm-cad-plan-bullet-dot" aria-hidden>
                        •
                      </span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {Array.isArray(plano.beneficiarios) &&
              plano.beneficiarios.length > 0 && (
                <>
                  <p className="cm-cad-plan-block-title">
                    Beneficiários contemplados ({plano.beneficiarios.length})
                  </p>
                  <div className="cm-cad-plan-chips">
                    {plano.beneficiarios.map((beneficiario) => (
                      <span key={beneficiario.id} className="cm-cad-plan-chip">
                        {beneficiario.nome}
                      </span>
                    ))}
                  </div>
                </>
              )}

            {isDisabled ? (
              <p className="cm-cad-plan-locked-note">
                Plano exibido apenas para consulta. A seleção segue o perfil
                calculado.
              </p>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

/* ================================================================
   Step 6 – Serviços adicionais
   ================================================================ */

function Step6Servicos({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const options = [
    {
      id: "clube-beneficios",
      title: "Clube de benefícios",
      desc: "Descontos de até 40% em parceiros.",
      badge: "Grátis",
      iconSrc: "/cliente-mobile/Vector-16.svg",
      iconW: 31,
      iconH: 30,
    },
    {
      id: "telemedicina",
      title: "Telemedicina",
      desc: "Atendimento médico à distância com profissionais qualificados.",
      badge: "R$ 19,90",
      iconSrc: "/cliente-mobile/Vector-14.svg",
      iconW: 30,
      iconH: 30,
    },
    {
      id: "pet",
      title: "Pet",
      desc: "Este benefício está bloqueado temporariamente.",
      badge: "Em breve",
      iconSrc: "/cliente-mobile/Vector-15.svg",
      iconW: 33,
      iconH: 30,
      disabled: true,
    },
  ];

  return (
    <>
      <p className="cm-cad-servicos-lead">
        Selecione os benefícios que deseja incluir no plano.
      </p>
      {options.map((opt) => {
        const checked = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            className={`cm-cad-service-card${checked ? " selected" : ""}${opt.disabled ? " disabled" : ""}`}
            onClick={() => {
              if (!opt.disabled) onToggle(opt.id);
            }}
            disabled={opt.disabled}
          >
            <div className="cm-cad-service-card-top">
              <div className={`cm-cad-plan-radio${checked ? " selected" : ""}`}>
                {checked && <div className="cm-cad-plan-radio-dot" />}
              </div>
              <div className="cm-cad-service-main">
                <p className="cm-cad-service-title">{opt.title}</p>
                <p className="cm-cad-service-desc">{opt.desc}</p>
              </div>
              <div className="cm-cad-service-icon">
                <Image
                  src={opt.iconSrc}
                  alt=""
                  width={opt.iconW}
                  height={opt.iconH}
                  aria-hidden
                />
              </div>
            </div>
            <span className="cm-cad-service-badge">{opt.badge}</span>
          </button>
        );
      })}
    </>
  );
}
void Step6Servicos;

/* ================================================================
   Step 7 – Forma de pagamento
   ================================================================ */

function Step7Pagamento({
  metodo,
  onMetodoChange,
}: {
  metodo: MetodoPagamento | "";
  onMetodoChange: (value: MetodoPagamento) => void;
}) {
  const opcoes: Array<{
    id: MetodoPagamento;
    title: string;
    desc: string;
    icon: LucideIcon;
  }> = [
    {
      id: "PIX",
      title: "PIX",
      desc: "Cobrança instantânea com QR Code.",
      icon: QrCode,
    },
    {
      id: "BOLETO",
      title: "Boleto bancário",
      desc: "Pagamento por boleto mensal.",
      icon: Barcode,
    },
    {
      id: "CARTAO",
      title: "Cartão de crédito",
      desc: "Recorrência automática no cartão.",
      icon: CreditCard,
    },
  ];

  return (
    <>
      <CadastroSectionHead
        iconSrc="/cliente-mobile/Vector-2.svg"
        iconWidth={35}
        iconHeight={37}
        title="Forma de pagamento"
        description="Selecione a forma de pagamento da recorrência."
      />

      {opcoes.map((opt) => {
        const checked = metodo === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            className={`cm-cad-payment-card${checked ? " selected" : ""}`}
            onClick={() => onMetodoChange(opt.id)}
          >
            <div className="cm-cad-payment-card-top">
              <div className={`cm-cad-plan-radio${checked ? " selected" : ""}`}>
                {checked && <div className="cm-cad-plan-radio-dot" />}
              </div>
              <div className="cm-cad-payment-main">
                <p className="cm-cad-service-title">{opt.title}</p>
                <p className="cm-cad-service-desc">{opt.desc}</p>
              </div>
              <div className="cm-cad-payment-icon">
                <Icon size={28} strokeWidth={2.15} aria-hidden />
              </div>
            </div>
          </button>
        );
      })}

      <p className="cm-cad-payment-help">
        Esse método será usado na criação inicial da recorrência.
      </p>

      {!metodo && (
        <p className="cm-cad-error">
          Selecione uma forma de pagamento para continuar.
        </p>
      )}
    </>
  );
}

/* ================================================================
   Step 8 – Confirmação
   ================================================================ */

function Step8Confirmacao({
  step1,
  dependentes,
  valorAdicionalDependenteForaGrade,
  plano,
  metodoPagamento,
  servicosAdicionais,
  consultores,
  selectedConsultorId,
  onSelectConsultor,
  isConsultorLocked,
  isLoadingConsultores,
  consultorError,
}: {
  step1: Partial<Step1Values>;
  dependentes: Dependente[];
  valorAdicionalDependenteForaGrade?: number | null;
  plano: Plano | null;
  metodoPagamento: MetodoPagamento | "";
  servicosAdicionais: string[];
  consultores: ConsultorOption[];
  selectedConsultorId?: number | typeof BOSQUE_DEFAULT;
  onSelectConsultor: (id: number | typeof BOSQUE_DEFAULT) => void;
  isConsultorLocked: boolean;
  isLoadingConsultores: boolean;
  consultorError: string | null;
}) {
  const [planoModalOpen, setPlanoModalOpen] = useState(false);
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  const metodoLabel = metodoPagamento
    ? METODO_PAGAMENTO_LABELS[metodoPagamento]
    : "Não informado";

  const adicionalDependentesTotal = dependentes.reduce((acc, dep) => {
    const parentesco = dep.parentesco?.trim();
    if (!parentesco) return acc;
    const isDirectInGrade = DIRECT_PARENTESCOS_GRADE_FAMILIAR.has(parentesco);
    const foraGradeFamiliar = dep.foraGradeFamiliar ?? !isDirectInGrade;
    if (!foraGradeFamiliar || dep.excluirCobrancaAdicional) return acc;

    const valorRealDependente = Number(dep.valorAdicionalMensal ?? 0);
    const valorRegra = Number(valorAdicionalDependenteForaGrade ?? 0);
    const valor =
      valorRealDependente > 0
        ? valorRealDependente
        : valorRegra > 0
          ? valorRegra
          : FALLBACK_VALOR_ADICIONAL_DEPENDENTE_FORA_GRADE;
    return acc + valor;
  }, 0);

  const totalMensalPlano =
    (plano?.valorMensal ?? 0) + adicionalDependentesTotal;

  useEffect(() => {
    if (!planoModalOpen || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [planoModalOpen]);

  return (
    <>
      <p className="cm-cad-step-sub cm-cad-step-sub--center">
        Revise os dados antes de finalizar.
      </p>

      <Field label="Consultor" error={consultorError ?? undefined}>
        {isLoadingConsultores ? (
          <p className="cm-cad-conf-muted">Carregando…</p>
        ) : isConsultorLocked ? (
          <p className="cm-cad-conf-consultor-locked">
            {consultores.find((c) => c.id === selectedConsultorId)?.nome ??
              `Consultor #${selectedConsultorId}`}
          </p>
        ) : (
          <select
            className={`cm-cad-select${consultorError ? " error" : ""}`}
            value={
              selectedConsultorId === BOSQUE_DEFAULT
                ? BOSQUE_DEFAULT
                : (selectedConsultorId?.toString() ?? "")
            }
            onChange={(ev) => {
              const val = ev.target.value;
              onSelectConsultor(
                val === BOSQUE_DEFAULT ? BOSQUE_DEFAULT : Number(val),
              );
            }}
          >
            <option value={BOSQUE_DEFAULT}>Campo do Bosque (padrão)</option>
            {consultores.map((c) => (
              <option key={c.id} value={c.id.toString()}>
                {c.nome}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="cm-cad-dep-screen">
        <div className="cm-cad-dep-count-bar" role="heading" aria-level={3}>
          <UserRound size={22} strokeWidth={2.2} aria-hidden />
          <span className="cm-cad-dep-count-bar-text">Titular</span>
        </div>
        <div className="cm-cad-dep-resumo-card">
          <div className="cm-cad-dep-resumo-main">
            {step1.nomeCompleto && (
              <p className="cm-cad-dep-resumo-line">
                Nome: {step1.nomeCompleto}
              </p>
            )}
            {step1.cpf && (
              <p className="cm-cad-dep-resumo-line">CPF: {step1.cpf}</p>
            )}
            {step1.email && (
              <p className="cm-cad-dep-resumo-line">E-mail: {step1.email}</p>
            )}
          </div>
        </div>

        {plano ? (
          <>
            <div className="cm-cad-dep-count-bar" role="heading" aria-level={3}>
              <ShieldUser size={22} strokeWidth={2.2} aria-hidden />
              <span className="cm-cad-dep-count-bar-text">
                Plano selecionado
              </span>
            </div>
            <div className="cm-cad-dep-resumo-card">
              <div className="cm-cad-dep-resumo-main">
                <p className="cm-cad-dep-resumo-line">Plano: {plano.nome}</p>
                <p className="cm-cad-dep-resumo-line">
                  Valor mensal:{" "}
                  <span className="cm-cad-summary-val--accent">
                    {fmt(plano.valorMensal)}
                  </span>
                </p>
                <p className="cm-cad-dep-resumo-line">
                  Adicionais:{" "}
                  {adicionalDependentesTotal > 0
                    ? fmt(adicionalDependentesTotal)
                    : "R$ 0,00"}
                </p>
                <p className="cm-cad-dep-resumo-line cm-cad-plan-total-line">
                  Total mensal:{" "}
                  <span className="cm-cad-summary-val--accent">
                    {fmt(totalMensalPlano)}
                  </span>
                </p>
                <button
                  type="button"
                  className="cm-cad-plan-more-btn"
                  onClick={() => setPlanoModalOpen(true)}
                >
                  Ver mais...
                </button>
              </div>
            </div>
          </>
        ) : null}

        <div className="cm-cad-dep-count-bar" role="heading" aria-level={3}>
          <Users size={22} strokeWidth={2.2} aria-hidden />
          <span className="cm-cad-dep-count-bar-text">
            Dependentes ({dependentes.length})
          </span>
        </div>
        {dependentes.length === 0 ? (
          <div className="cm-cad-dep-resumo-card">
            <div className="cm-cad-dep-resumo-main">
              <p className="cm-cad-conf-muted">Nenhum dependente adicionado.</p>
            </div>
          </div>
        ) : (
          dependentes.map((dep, idx) => {
            const idade =
              dep.idade != null
                ? dep.idade
                : dep.dataNascimento
                  ? calcularIdade(dep.dataNascimento)
                  : null;
            const adicionalTexto = getAdicionalPillText(
              dep,
              valorAdicionalDependenteForaGrade,
            );
            return (
              <div
                key={`${dep.nome}-${idx}`}
                className="cm-cad-dep-resumo-card"
              >
                <div className="cm-cad-dep-resumo-main">
                  <p className="cm-cad-dep-resumo-name">
                    {(dep.nome ?? "").trim() || `Dependente ${idx + 1}`}
                  </p>
                  <p className="cm-cad-dep-resumo-line">
                    Parentesco: {dep.parentesco?.trim() || "—"}
                  </p>
                  <p className="cm-cad-dep-resumo-line">
                    Idade: {idade != null ? `${idade} anos` : "—"}
                  </p>
                  <p className="cm-cad-dep-resumo-line">
                    Data Nascimento: {formatDateBR(dep.dataNascimento)}
                  </p>
                  {adicionalTexto ? (
                    <div className="cm-cad-dep-adicional-pill">
                      {adicionalTexto}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}

        <div className="cm-cad-dep-count-bar" role="heading" aria-level={3}>
          <CreditCard size={22} strokeWidth={2.2} aria-hidden />
          <span className="cm-cad-dep-count-bar-text">Pagamento</span>
        </div>
        <div className="cm-cad-dep-resumo-card">
          <div className="cm-cad-dep-resumo-main">
            <p className="cm-cad-dep-resumo-line">Método: {metodoLabel}</p>
          </div>
        </div>

        <div className="cm-cad-dep-count-bar" role="heading" aria-level={3}>
          <HandCoins size={22} strokeWidth={2.2} aria-hidden />
          <span className="cm-cad-dep-count-bar-text">Serviços adicionais</span>
        </div>
        <div className="cm-cad-dep-resumo-card">
          <div className="cm-cad-dep-resumo-main">
            {servicosAdicionais.length === 0 ? (
              <p className="cm-cad-conf-muted">
                Nenhum serviço adicional selecionado.
              </p>
            ) : (
              <ul className="cm-cad-conf-servico-list">
                {servicosAdicionais.map((id) => (
                  <li key={id}>
                    {SERVICO_ADICIONAL_LABELS[id] ?? id.replace(/-/g, " ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {plano && planoModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="cm-cad-plan-modal-overlay"
              role="presentation"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0, 0, 0, 0.44)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px",
              }}
            >
              <div
                className="cm-cad-plan-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="plano-modal-title"
                style={{
                  width: "min(460px, 100%)",
                  maxHeight: "84dvh",
                  overflowY: "auto",
                  borderRadius: "18px",
                  background: "#ffffff",
                  padding: "18px 16px 16px",
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  className="cm-cad-plan-modal-close"
                  aria-label="Fechar"
                  onClick={() => setPlanoModalOpen(false)}
                >
                  <Image
                    src="/cliente-mobile/Vector-39.svg"
                    alt=""
                    width={31}
                    height={31}
                    aria-hidden
                  />
                </button>

                <h3 id="plano-modal-title" className="cm-cad-plan-modal-title">
                  {plano.nome}
                </h3>

                <div className="cm-cad-plan-modal-list">
                  <p>
                    Mensalidade base: <strong>{fmt(plano.valorMensal)}</strong>
                  </p>
                  <p>
                    Adicionais de dependentes:{" "}
                    <strong>
                      {adicionalDependentesTotal > 0
                        ? fmt(adicionalDependentesTotal)
                        : "R$ 0,00"}
                    </strong>
                  </p>
                  <p>
                    Total mensal estimado:{" "}
                    <strong>{fmt(totalMensalPlano)}</strong>
                  </p>
                  <p>
                    Carência: <strong>{plano.carenciaDias} dias</strong>
                  </p>
                  <p>
                    Vigência: <strong>{plano.vigenciaMeses} meses</strong>
                  </p>
                  <p>
                    Cobertura máxima:{" "}
                    <strong>{fmt(plano.coberturaMaxima)}</strong>
                  </p>
                  {plano.idadeMaxima != null ? (
                    <p>
                      Idade máxima de entrada:{" "}
                      <strong>{plano.idadeMaxima} anos</strong>
                    </p>
                  ) : null}
                  {Array.isArray(plano.coberturas) &&
                  plano.coberturas.length > 0 ? (
                    <p>
                      Coberturas principais:{" "}
                      <strong>
                        {plano.coberturas
                          .slice(0, 3)
                          .map((c) => c.descricao)
                          .join(", ")}
                      </strong>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/* ================================================================
   MobileCadastroScreen (root)
   ================================================================ */

export default function MobileCadastroScreen() {
  const isDev = process.env.NODE_ENV === "development";
  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isHandlingPopStateRef = useRef(false);
  const lastHistoryStepRef = useRef<number | null>(null);
  const historyBootstrappedRef = useRef(false);

  /* Step forms */
  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(dadosPessoaisSchema) as Resolver<Step1Values>,
  });
  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(enderecoSchema) as Resolver<Step2Values>,
  });
  const [usarMesmosDados] = useState(false);
  const step3Form = useForm<Step3Values>({
    resolver: zodResolver(responsavelFinanceiroSchema) as Resolver<Step3Values>,
    defaultValues: { usarMesmosDados: false },
  });

  /* Dependentes */
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [depErrors, setDepErrors] = useState<DepErrors[]>([]);
  const [editingDepIndex, setEditingDepIndex] = useState<number | null>(null);
  const [depConfirmados, setDepConfirmados] = useState<boolean[]>([]);
  const [limiteBeneficiarios, setLimiteBeneficiarios] = useState(MAX_DEP);
  const [
    valorAdicionalDependenteForaGrade,
    setValorAdicionalDependenteForaGrade,
  ] = useState<number | null>(null);

  /* Plano */
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [planoError, setPlanoError] = useState<string | null>(null);
  const [servicosAdicionais, setServicosAdicionais] = useState<string[]>([]);
  void setServicosAdicionais;
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | "">(
    "",
  );

  /* Consultor */
  const [consultores, setConsultores] = useState<ConsultorOption[]>([]);
  const [selectedConsultorId, setSelectedConsultorId] = useState<
    number | typeof BOSQUE_DEFAULT | undefined
  >();
  const [consultorError, setConsultorError] = useState<string | null>(null);
  const [consultorIdFromQuery, setConsultorIdFromQuery] = useState<
    number | undefined
  >();
  const [isLoadingConsultores, setIsLoadingConsultores] = useState(true);

  useEffect(() => {
    if (currentStep !== 5) {
      setEditingDepIndex(null);
    }
  }, [currentStep]);

  /* Sync wizard step with browser history for Android back button */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = (event: PopStateEvent) => {
      const stepFromHistory = Number(event.state?.clienteCadastroStep);
      if (Number.isInteger(stepFromHistory) && stepFromHistory >= 1) {
        isHandlingPopStateRef.current = true;
        setCurrentStep(Math.min(stepFromHistory, STEPS.length));
        setSubmitError(null);
        return;
      }
      window.location.href = "/cliente";
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!historyBootstrappedRef.current) {
      window.history.replaceState(
        { ...(window.history.state ?? {}), clienteCadastroStep: currentStep },
        "",
      );
      lastHistoryStepRef.current = currentStep;
      historyBootstrappedRef.current = true;
      return;
    }

    if (isHandlingPopStateRef.current) {
      lastHistoryStepRef.current = currentStep;
      isHandlingPopStateRef.current = false;
      return;
    }

    if (lastHistoryStepRef.current === currentStep) return;
    lastHistoryStepRef.current = currentStep;

    window.history.pushState(
      { ...(window.history.state ?? {}), clienteCadastroStep: currentStep },
      "",
    );
  }, [currentStep]);

  useEffect(() => {
    if (dependentes.length === 0) {
      setEditingDepIndex(null);
      setDepConfirmados([]);
    }
  }, [dependentes.length]);

  const handleConfirmDependent = (idx: number) => {
    const err = validateSingleDependente(dependentes[idx]);
    setDepErrors((prev) => {
      const next = [...prev];
      while (next.length <= idx) next.push({});
      next[idx] = err;
      return next;
    });
    if (Object.keys(err).length > 0) return;
    setDepConfirmados((prev) => {
      const next = [...prev];
      while (next.length <= idx) next.push(false);
      next[idx] = true;
      return next;
    });
    setEditingDepIndex(null);
  };

  const { mutateAsync, isPending } = useCreateTitular({ variant: "public" });

  /* Fetch planos via /plano/sugerir (same as PlanoForm desktop) */
  const step1DataForPlanos = step1Form.watch();
  const dependentesElegiveisParaPlano = dependentes.filter((dep, idx) => {
    const confirmado = Boolean(depConfirmados[idx]);
    return confirmado && isDependenteComplete(dep);
  });

  const participantesPayload = (() => {
    const list: ParticipanteMin[] = [
      {
        dataNascimento: step1DataForPlanos.dataNascimento ?? null,
        idade: step1DataForPlanos.dataNascimento
          ? calcularIdade(step1DataForPlanos.dataNascimento)
          : null,
        parentesco: "Titular",
      },
      ...dependentesElegiveisParaPlano.map((d) => ({
        dataNascimento: d.dataNascimento ?? null,
        idade: d.dataNascimento ? calcularIdade(d.dataNascimento) : null,
        parentesco: d.parentesco ?? "Outro",
      })),
    ];
    return list;
  })();

  const canSuggestPlanos =
    participantesPayload.length > 0 &&
    participantesPayload.every((p) =>
      Boolean(p.dataNascimento || p.idade != null),
    );

  const { data: planosData = [], isLoading: isLoadingPlanos } = useQuery<
    Plano[]
  >({
    queryKey: ["planos-mobile-cad", participantesPayload],
    queryFn: async () => {
      try {
        const res = await api.post("/plano/sugerir", {
          participantes: participantesPayload,
          retornarTodos: true,
        });
        const data = sanitizePlanoArray(res.data);
        return data.sort((a, b) => a.valorMensal - b.valorMensal);
      } catch {
        return [];
      }
    },
    enabled: canSuggestPlanos,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!Array.isArray(planosData) || planosData.length === 0) {
      setSelectedPlano(null);
      return;
    }

    setSelectedPlano((prev) => {
      if (prev && planosData.some((p) => String(p.id) === String(prev.id))) {
        return prev;
      }

      const maiorIdade = obterMaiorIdadeParticipantes(participantesPayload);
      return selecionarPlanoPorMaiorIdade(planosData, maiorIdade);
    });
  }, [planosData, participantesPayload]);

  /* Fetch regras */
  useEffect(() => {
    api
      .get("/regras")
      .then((res) => {
        const regra = Array.isArray(res.data) ? res.data[0] : null;
        const limite = Number(regra?.limiteBeneficiarios);
        const valorAdicional = Number(regra?.valorAdicionalDependenteForaGrade);
        if (Number.isFinite(limite) && limite > 0) {
          setLimiteBeneficiarios(Math.min(limite, MAX_DEP));
        }
        if (Number.isFinite(valorAdicional) && valorAdicional > 0) {
          setValorAdicionalDependenteForaGrade(valorAdicional);
        } else {
          setValorAdicionalDependenteForaGrade(null);
        }
      })
      .catch(() => {});
  }, []);

  /* Fetch consultores */
  useEffect(() => {
    let alive = true;
    api
      .get("/consultor/public")
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setConsultores(
          list
            .map((item: Record<string, unknown>) => ({
              id: Number(item.id),
              nome: String(item.nome ?? "").trim(),
            }))
            .filter((c: ConsultorOption) => c.id > 0 && c.nome.length > 0),
        );
      })
      .catch(() => {
        if (alive) setConsultores([]);
      })
      .finally(() => {
        if (alive) setIsLoadingConsultores(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Consultor from URL */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = Number(
      new URLSearchParams(window.location.search).get("consultorId"),
    );
    if (Number.isFinite(id) && id > 0) setConsultorIdFromQuery(id);
  }, []);

  useEffect(() => {
    if (consultorIdFromQuery) setSelectedConsultorId(consultorIdFromQuery);
  }, [consultorIdFromQuery]);

  useEffect(() => {
    if (consultorIdFromQuery) return;
    if (selectedConsultorId) return;
    if (isLoadingConsultores) return;
    setSelectedConsultorId(BOSQUE_DEFAULT);
  }, [consultorIdFromQuery, isLoadingConsultores, selectedConsultorId]);

  /* ViaCEP – step 2 */
  const cep2 = step2Form.watch("cep");
  useEffect(() => {
    const cep = (cep2 || "").replace(/\D/g, "");
    if (cep.length !== 8) return;
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.erro) return;
        step2Form.setValue("logradouro", data.logradouro || "");
        step2Form.setValue("bairro", data.bairro || "");
        step2Form.setValue("cidade", data.localidade || "");
        step2Form.setValue("uf", normalizeUfCode(data.uf));
      })
      .catch(() => {});
  }, [cep2, step2Form]);

  /* ViaCEP – step 3 */
  const cep3 = step3Form.watch("cep");
  useEffect(() => {
    if (usarMesmosDados) return;
    const cep = (cep3 || "").replace(/\D/g, "");
    if (cep.length !== 8) return;
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.erro) return;
        step3Form.setValue("logradouro", data.logradouro || "");
        step3Form.setValue("bairro", data.bairro || "");
        step3Form.setValue("cidade", data.localidade || "");
        step3Form.setValue("uf", normalizeUfCode(data.uf));
      })
      .catch(() => {});
  }, [cep3, step3Form, usarMesmosDados]);

  /* Dependentes validation */
  const validateDependentes = (deps: Dependente[]) => {
    const errors = deps.map((dep) => validateSingleDependente(dep));
    return {
      isValid: errors.every((e) => Object.keys(e).length === 0),
      errors,
    };
  };

  /* Validate current step */
  const validateCurrent = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        return await step1Form.trigger(undefined, { shouldFocus: true });
      case 2:
        return await step2Form.trigger(undefined, { shouldFocus: true });
      case 3:
        step3Form.setValue("usarMesmosDados", usarMesmosDados);
        return await step3Form.trigger(
          [
            "nomeCompleto",
            "cpf",
            "rg",
            "dataNascimento",
            "parentesco",
            "sexo",
            "naturalidade",
            "situacaoConjugal",
            "profissao",
            "email",
            "telefone",
            "whatsapp",
          ],
          { shouldFocus: true },
        );
      case 4:
        return await step3Form.trigger(
          [
            "cep",
            "uf",
            "cidade",
            "bairro",
            "logradouro",
            "numero",
            "complemento",
            "pontoReferencia",
          ],
          { shouldFocus: true },
        );
      case 5: {
        const { isValid, errors } = validateDependentes(dependentes);
        setDepErrors(errors);
        if (!isValid) {
          const firstInvalid = errors.findIndex(
            (e) => Object.keys(e).length > 0,
          );
          if (firstInvalid >= 0) {
            setEditingDepIndex(firstInvalid);
          }
          return false;
        }
        const firstUnconfirmed = dependentes.findIndex(
          (_, i) => depConfirmados[i] !== true,
        );
        if (firstUnconfirmed >= 0) {
          setEditingDepIndex(firstUnconfirmed);
          return false;
        }
        return true;
      }
      case 6:
        if (!selectedPlano) {
          setPlanoError("Selecione um plano para continuar.");
          return false;
        }
        return true;
      case 7:
        if (!metodoPagamento) return false;
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    const ok = isDev ? true : await validateCurrent();
    if (!ok) return;
    if (currentStep < STEPS.length) {
      setCurrentStep((p) => p + 1);
      setSubmitError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((p) => p - 1);
      setSubmitError(null);
    } else {
      window.location.href = "/cliente";
    }
  };

  const handleFinish = async () => {
    if (!selectedConsultorId) {
      setConsultorError("Selecione um consultor para continuar.");
      return;
    }
    setSubmitError(null);
    try {
      const payload: CreateTitularInput = {
        step1: step1Form.getValues(),
        step2: step2Form.getValues(),
        step3: { ...step3Form.getValues(), usarMesmosDados },
        step5: {
          planoId: selectedPlano ? Number(selectedPlano.id) : undefined,
          plano: selectedPlano,
        },
        dependentes,
        usarMesmosDados,
        consultorId:
          typeof selectedConsultorId === "number"
            ? selectedConsultorId
            : undefined,
        forceTenantBosque: selectedConsultorId === BOSQUE_DEFAULT,
      };
      await mutateAsync(payload);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Erro ao finalizar cadastro.",
      );
    }
  };

  /* UF watchers */
  const uf2 = normalizeUfCode(step2Form.watch("uf") || "");
  const uf3 = normalizeUfCode(step3Form.watch("uf") || "");

  /* Render current step */
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Form form={step1Form} />;
      case 2:
        return <Step2Form form={step2Form} ufValue={uf2} />;
      case 3:
        return <Step3Form form={step3Form} usarMesmosDados={usarMesmosDados} />;
      case 4:
        return <Step4AddressForm form={step3Form} ufValue={uf3} />;
      case 5:
        return (
          <Step4Form
            dependentes={dependentes}
            errors={depErrors}
            onChange={setDependentes}
            onFieldEdited={(idx, field) =>
              setDepErrors((prev) => {
                const current = prev[idx];
                if (!current || !current[field]) return prev;
                const next = [...prev];
                next[idx] = { ...current, [field]: undefined };
                return next;
              })
            }
            limiteBeneficiarios={limiteBeneficiarios}
            editingDepIndex={editingDepIndex}
            onEditingDepIndexChange={setEditingDepIndex}
            depConfirmados={depConfirmados}
            onConfirmDependent={handleConfirmDependent}
            onDepAdded={() => setDepConfirmados((prev) => [...prev, false])}
            onDepRemoved={(idx) => {
              setDepConfirmados((prev) => prev.filter((_, i) => i !== idx));
              setDepErrors((prev) => prev.filter((_, i) => i !== idx));
            }}
            onInvalidateDepConfirm={(idx) =>
              setDepConfirmados((prev) => {
                if (!prev[idx]) return prev;
                const next = [...prev];
                next[idx] = false;
                return next;
              })
            }
            valorAdicionalDependenteForaGrade={
              valorAdicionalDependenteForaGrade
            }
          />
        );
      case 6:
        return (
          <Step5Plano
            planos={planosData}
            isLoading={isLoadingPlanos}
            selected={selectedPlano}
            onSelect={(p) => {
              setSelectedPlano(p);
              setPlanoError(null);
            }}
            error={planoError}
            selectionLocked
          />
        );
      case 7:
        return (
          <Step7Pagamento
            metodo={metodoPagamento}
            onMetodoChange={(value) => setMetodoPagamento(value)}
          />
        );
      case 8:
        return (
          <Step8Confirmacao
            step1={step1Form.getValues()}
            dependentes={dependentes}
            valorAdicionalDependenteForaGrade={
              valorAdicionalDependenteForaGrade
            }
            plano={selectedPlano}
            metodoPagamento={metodoPagamento}
            servicosAdicionais={servicosAdicionais}
            consultores={consultores}
            selectedConsultorId={selectedConsultorId}
            onSelectConsultor={(id) => {
              setSelectedConsultorId(id);
              setConsultorError(null);
            }}
            isConsultorLocked={Boolean(consultorIdFromQuery)}
            isLoadingConsultores={isLoadingConsultores}
            consultorError={consultorError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="cm-cad-root">
      {/* ── Header: igual alterar-senha ── */}
      <div className="cm-app-header">
        <div className="cm-app-header-row">
          <button
            type="button"
            className="cm-btn-back"
            onClick={handleBack}
            aria-label="Voltar"
          >
            <Image
              src="/cliente-mobile/Vector-30.svg"
              alt=""
              width={20}
              height={17}
              aria-hidden
            />
          </button>
          <h1>Cadastro</h1>
        </div>
      </div>

      {/* ── White panel ── */}
      <div className="cm-cad-panel">
        {/* Progress carousel */}
        <div className="cm-cad-progress-wrap">
          <div className="cm-cad-step-heading">
            <p className="cm-cad-step-label">
              <span className="cm-cad-step-name">
                {STEPS[currentStep - 1].title}
              </span>
            </p>
            {currentStep === 5 ? (
              <p
                className="cm-cad-dep-limit cm-cad-dep-limit--after-title"
                aria-live="polite"
              >
                Limite : {limiteBeneficiarios}
              </p>
            ) : null}
          </div>

          <div className="cm-cad-progress">
            {/* <button
              type="button"
              className="cm-cad-progress-arrow"
              onClick={handleCarouselBack}
              disabled={currentStep === 1}
              aria-label="Etapa anterior"
            >
              <ChevronLeft size={16} />
            </button> */}

            <div className="cm-cad-progress-dots">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  className={`cm-cad-progress-dot${
                    step.id === currentStep
                      ? " active"
                      : step.id < currentStep
                        ? " done"
                        : ""
                  }`}
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id);
                  }}
                  aria-label={`Etapa ${step.id}: ${step.title}`}
                />
              ))}
            </div>

            {/* <button
              type="button"
              className="cm-cad-progress-arrow"
              onClick={handleNext}
              disabled={currentStep === STEPS.length}
              aria-label="Próxima etapa"
            >
              <ChevronRight size={16} />
            </button> */}
          </div>
        </div>

        {/* Scrollable form */}
        <div className="cm-cad-scroll" key={currentStep}>
          <div className="cm-cad-form cm-fade-up">
            {renderStep()}
            {submitError && <ErrBox message={submitError} />}
            {/* bottom padding so last field isn't hidden by nav */}
            <div style={{ height: 8 }} />
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="cm-cad-nav">
          {currentStep > 1 ? (
            <button
              type="button"
              className="cm-cad-nav-back"
              onClick={handleBack}
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
          ) : null}

          {currentStep < STEPS.length ? (
            <button
              type="button"
              className="cm-cad-nav-next"
              onClick={handleNext}
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="cm-cad-nav-next"
              onClick={handleFinish}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="cm-spinner" />
                  Finalizando…
                </>
              ) : (
                "Finalizar Cadastro"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
