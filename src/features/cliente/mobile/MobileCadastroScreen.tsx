"use client";

import "@/app/styles/cliente-mobile.css";

import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  RELATIONSHIP_OPTIONS,
  isDirectFamilyRelationship,
  isResponsibleFinancialRelationshipInPlan,
  isResponsibleFinancialRelationshipWithoutAdditional,
} from "@/constants/relationshipOptions";
import { BRAZIL_STATES, normalizeUfCode } from "@/constants/brazilStates";
import {
  formatCPF,
  formatPhone,
  formatWhatsApp,
  getWhatsAppFromPhone,
  formatRG,
  formatCEP,
  validateCPF,
} from "@/helpers/formHelpers";
import {
  calcularIdade,
  obterMaiorIdadeParticipantes,
  selecionarPlanosCompativeis,
  selecionarPlanoPorMaiorIdade,
  type ParticipanteMin,
} from "@/utils/planos";
import {
  obterMatrizTarifacaoDependente,
  obterValorAdicionalDependentePorIdade,
  type FaixaTarifacaoDependente,
} from "@/utils/dependenteTarifacao";
import {
  useCreateTitular,
  type CreateTitularInput,
} from "@/hooks/mutations/useCreateTitular";
import type { Dependente } from "@/types/DependentesType";
import type { Plano } from "@/types/PlanType";
import api from "@/utils/api";
import { fetchSuggestedPlanosWithRetry } from "@/services/planoSuggestion";
import { extractApiError } from "@/utils/httpError";
import { ConsultorLookupCard } from "@/components/ConsultorLookupCard";
import {
  normalizeConsultorCode,
  resolveConsultorPublicByCode,
  resolveConsultorPublicLegacy,
  type ConsultorPublicResult,
} from "@/utils/consultorPublic";

/* ================================================================
   Types
   ================================================================ */

type Step1Values = z.infer<typeof dadosPessoaisSchema>;
type Step2Values = z.infer<typeof enderecoSchema>;
type Step3Values = z.infer<typeof responsavelFinanceiroSchema>;
type CreditCardValues = {
  holderName: string;
  holderCpf: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

type CreditCardErrors = Partial<Record<keyof CreditCardValues, string>>;

interface DepErrors {
  nome?: string;
  dataNascimento?: string;
  parentesco?: string;
  telefone?: string;
  cpf?: string;
}

function validateSingleDependente(dep: Dependente): DepErrors {
  const err: DepErrors = {};
  const idade = dep.dataNascimento ? calcularIdade(dep.dataNascimento) : null;
  if (!dep.nome?.trim()) err.nome = "Nome é obrigatório";
  if (!dep.dataNascimento) {
    err.dataNascimento = "Data de nascimento é obrigatória";
  } else if (idade === null || idade < 0) {
    err.dataNascimento = "Data de nascimento inválida";
  }
  if (!dep.parentesco) err.parentesco = "Parentesco é obrigatório";
  if (dep.telefone && dep.telefone.replace(/\D/g, "").length < 10)
    err.telefone = "Telefone inválido";
  if (dep.cpf && !validateCPF(dep.cpf)) err.cpf = "CPF inválido";
  return err;
}

function isDependenteComplete(dep: Dependente): boolean {
  return Object.keys(validateSingleDependente(dep)).length === 0;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatCardExpiryMonth(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

function formatCardExpiryYear(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

function formatCardCcv(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

function validateCreditCard(card: CreditCardValues): CreditCardErrors {
  const errors: CreditCardErrors = {};
  if (!card.holderName.trim() || card.holderName.trim().length < 3) {
    errors.holderName = "Informe o nome impresso no cartão.";
  }
  if (card.holderCpf.replace(/\D/g, "").length !== 11) {
    errors.holderCpf = "CPF do portador inválido.";
  }
  const cardDigits = card.number.replace(/\D/g, "");
  if (cardDigits.length < 13 || cardDigits.length > 19) {
    errors.number = "Número do cartão inválido.";
  }
  const month = Number(card.expiryMonth.replace(/\D/g, ""));
  if (!month || month < 1 || month > 12) {
    errors.expiryMonth = "Mês inválido.";
  }
  const yearDigits = card.expiryYear.replace(/\D/g, "");
  if (yearDigits.length !== 2 && yearDigits.length !== 4) {
    errors.expiryYear = "Ano inválido.";
  }
  if (card.ccv.replace(/\D/g, "").length < 3) {
    errors.ccv = "CVV inválido.";
  }
  return errors;
}

const PRIVACY_POLICY_VERSION = "2025-06";
const SERVICE_CONTRACT_VERSION = "2025-06";
const CADASTRO_CONSENT_ORIGIN = "cliente_mobile_cadastro_publico";
function formatAdicionalMensal(valor: number): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "R$ —";
  // Mantém o mesmo formato visual do new-ui: "R$ 19,90"
  const v = n.toFixed(2).replace(".", ",");
  return `R$ ${v}`;
}

function formatCoberturaFamiliar(coberturaMaxima?: number | null): string {
  const quantidadeNormalizada = Number(coberturaMaxima ?? NaN);
  const quantidade =
    Number.isFinite(quantidadeNormalizada) && quantidadeNormalizada > 0
      ? quantidadeNormalizada
      : 8;
  const label = quantidade === 1 ? "beneficiário" : "beneficiários";
  return `Até ${quantidade} ${label}`;
}

function getAdicionalPillText(
  dep: Dependente,
  matrizTarifacaoDependente: FaixaTarifacaoDependente[],
): string | null {
  const parentesco = dep.parentesco?.trim();
  if (!parentesco) return null;

  const isDirectInGrade = isDirectFamilyRelationship(parentesco);
  const foraGradeFamiliar = dep.foraGradeFamiliar ?? !isDirectInGrade;
  if (!foraGradeFamiliar) return null;
  if (dep.excluirCobrancaAdicional) return null;

  const valorRealDependente = Number(dep.valorAdicionalMensal ?? 0);
  const valor =
    valorRealDependente > 0
      ? valorRealDependente
      : getValorAdicionalPorIdade(dep, matrizTarifacaoDependente);

  const valorFmt = formatAdicionalMensal(valor);
  if (valorFmt === "R$ —") return "Adicional";

  return `Adicional: ${valorFmt}`;
}

function getValorAdicionalPorIdade(
  dep: Dependente,
  matrizTarifacaoDependente: FaixaTarifacaoDependente[],
): number {
  const idade =
    typeof dep.idade === "number" && Number.isFinite(dep.idade)
      ? dep.idade
      : calcularIdade(dep.dataNascimento ?? null);
  return obterValorAdicionalDependentePorIdade(
    idade,
    matrizTarifacaoDependente,
  );
}

function getAdicionalParticipantePorParentesco(
  participante: Pick<
    Dependente,
    | "parentesco"
    | "dataNascimento"
    | "idade"
    | "foraGradeFamiliar"
    | "excluirCobrancaAdicional"
    | "valorAdicionalMensal"
  >,
  matrizTarifacaoDependente: FaixaTarifacaoDependente[],
): number {
  const parentesco = participante.parentesco?.trim();
  if (!parentesco) return 0;

  const isDirectInGrade = isDirectFamilyRelationship(parentesco);
  const foraGradeFamiliar = participante.foraGradeFamiliar ?? !isDirectInGrade;
  if (!foraGradeFamiliar || participante.excluirCobrancaAdicional) return 0;

  const valorReal = Number(participante.valorAdicionalMensal ?? 0);
  if (valorReal > 0) return valorReal;

  return getValorAdicionalPorIdade(
    participante as Dependente,
    matrizTarifacaoDependente,
  );
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

const MAX_DEP = 8;
const ENABLE_PARCERIAS_CADASTRO = false;

const STEPS = [
  { id: 1, title: "Titular" },
  { id: 2, title: "Endereço do titular" },
  { id: 3, title: "Corresponsável financeiro" },
  { id: 4, title: "Endereço do corresponsável" },
  { id: 5, title: "Dependentes" },
  { id: 6, title: "Planos" },
  { id: 7, title: "Serviços adicionais" },
  { id: 8, title: "Forma de pagamento" },
  { id: 9, title: "Confirmação de cadastro" },
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
  void iconSrc;
  void iconWidth;
  void iconHeight;
  void title;
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
   Step 3 – Corresponsável Financeiro
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
  usarMesmoEndereco,
  onToggleUsarMesmoEndereco,
}: {
  form: UseFormReturn<Step3Values>;
  ufValue: string;
  usarMesmoEndereco: boolean;
  onToggleUsarMesmoEndereco: (checked: boolean) => void;
}) {
  const e = form.formState.errors;
  const disabled = usarMesmoEndereco;

  return (
    <>
      <label className="cm-cad-same-address-checkbox">
        <div
          className={`cm-cad-checkbox-box${usarMesmoEndereco ? " checked" : ""}`}
          onClick={() => onToggleUsarMesmoEndereco(!usarMesmoEndereco)}
          role="checkbox"
          aria-checked={usarMesmoEndereco}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter")
              onToggleUsarMesmoEndereco(!usarMesmoEndereco);
          }}
        >
          {usarMesmoEndereco && (
            <svg
              viewBox="0 0 12 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="cm-cad-checkbox-check"
            >
              <path
                d="M1 5L4.5 8.5L11 1.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <span className="cm-cad-checkbox-label">
          Usar o mesmo endereço do titular
        </span>
      </label>

      <div className="cm-cad-row-2">
        <Field
          label="CEP"
          required
          error={!disabled ? e.cep?.message?.toString() : undefined}
        >
          <input
            className={`cm-cad-input${!disabled && e.cep ? " error" : ""}${disabled ? " disabled" : ""}`}
            maxLength={9}
            placeholder="00000-000"
            inputMode="numeric"
            value={form.watch("cep") || ""}
            onChange={(ev) =>
              !disabled && form.setValue("cep", formatCEP(ev.target.value))
            }
            readOnly={disabled}
          />
        </Field>

        <Field
          label="UF"
          required
          error={!disabled ? e.uf?.message?.toString() : undefined}
        >
          <select
            className={`cm-cad-select${!disabled && e.uf ? " error" : ""}${disabled ? " disabled" : ""}`}
            value={ufValue}
            onChange={(ev) => !disabled && form.setValue("uf", ev.target.value)}
            disabled={disabled}
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

      <Field
        label="Cidade"
        required
        error={!disabled ? e.cidade?.message?.toString() : undefined}
      >
        <input
          className={`cm-cad-input${!disabled && e.cidade ? " error" : ""}${disabled ? " disabled" : ""}`}
          maxLength={191}
          placeholder="Cidade"
          readOnly={disabled}
          {...form.register("cidade")}
        />
      </Field>

      <Field
        label="Bairro"
        required
        error={!disabled ? e.bairro?.message?.toString() : undefined}
      >
        <input
          className={`cm-cad-input${!disabled && e.bairro ? " error" : ""}${disabled ? " disabled" : ""}`}
          maxLength={191}
          placeholder="Bairro"
          readOnly={disabled}
          {...form.register("bairro")}
        />
      </Field>

      <div className="cm-cad-row-street">
        <Field
          label="Rua"
          required
          error={!disabled ? e.logradouro?.message?.toString() : undefined}
        >
          <input
            className={`cm-cad-input${!disabled && e.logradouro ? " error" : ""}${disabled ? " disabled" : ""}`}
            maxLength={191}
            placeholder="Logradouro"
            readOnly={disabled}
            {...form.register("logradouro")}
          />
        </Field>

        <Field
          label="Número"
          required
          error={!disabled ? e.numero?.message?.toString() : undefined}
        >
          <input
            className={`cm-cad-input${!disabled && e.numero ? " error" : ""}${disabled ? " disabled" : ""}`}
            maxLength={50}
            placeholder="Nº"
            readOnly={disabled}
            {...form.register("numero")}
          />
        </Field>
      </div>

      <Field label="Complemento">
        <input
          className={`cm-cad-input${disabled ? " disabled" : ""}`}
          maxLength={191}
          placeholder="Opcional"
          readOnly={disabled}
          {...form.register("complemento")}
        />
      </Field>

      <Field
        label="Ponto de referência"
        required
        error={!disabled ? e.pontoReferencia?.message?.toString() : undefined}
      >
        <input
          className={`cm-cad-input${!disabled && e.pontoReferencia ? " error" : ""}${disabled ? " disabled" : ""}`}
          maxLength={255}
          placeholder="Próximo a…"
          readOnly={disabled}
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
  matrizTarifacaoDependente,
  vagasJaConsumidas,
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
  matrizTarifacaoDependente: FaixaTarifacaoDependente[];
  vagasJaConsumidas: number;
}) {
  const canAdd = dependentes.length + vagasJaConsumidas < limiteBeneficiarios;
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
    return isDirectFamilyRelationship(parentesco) ? "Direto" : "Indireto";
  };

  const getDepAdicionalValor = (dep: Dependente): number => {
    const parentesco = dep.parentesco?.trim();
    if (!parentesco)
      return getValorAdicionalPorIdade(dep, matrizTarifacaoDependente);
    const isDirectInGrade = isDirectFamilyRelationship(parentesco);
    const foraGradeFamiliar = dep.foraGradeFamiliar ?? !isDirectInGrade;
    if (!foraGradeFamiliar || dep.excluirCobrancaAdicional) return 0;
    const valorRealDependente = Number(dep.valorAdicionalMensal ?? 0);
    if (valorRealDependente > 0) return valorRealDependente;
    return getValorAdicionalPorIdade(dep, matrizTarifacaoDependente);
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
          matrizTarifacaoDependente,
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
              onClick={closeDepModal}
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
                onClick={(ev) => ev.stopPropagation()}
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
              onClick={() => setDepInfoModalOpen(false)}
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
                onClick={(ev) => ev.stopPropagation()}
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
                      netos, pais (ou, na ausência destes, padrasto ou madrasta)
                      e sogros.
                    </p>
                    <span className="cm-cad-dep-info-note">
                      <span className="cm-cad-required">*</span>
                      Já incluídos na grade familiar do plano (sem custo
                      adicional).
                    </span>
                  </section>
                  <section className="cm-cad-dep-info-box">
                    <strong>Dependentes Indiretos</strong>
                    <p>
                      Sobrinhos, tios, irmãos, avós, cunhados, entre outros.
                    </p>
                    <div className="cm-cad-dep-info-pill">
                      <span className="cm-cad-required">*</span>
                      <span>
                        R$ 9,90 ate 60 anos | R$ 19,90 ate 70 | R$ 29,90 ate 80
                        | R$ 49,00 acima de 80
                      </span>
                    </div>
                  </section>
                  <section className="cm-cad-dep-info-box">
                    <strong>Outros</strong>
                    <p>Pessoas sem grau de parentesco com o titular.</p>
                    <div className="cm-cad-dep-info-pill">
                      <span className="cm-cad-required">*</span>
                      <span>
                        R$ 9,90 ate 60 anos | R$ 19,90 ate 70 | R$ 29,90 ate 80
                        | R$ 49,00 sem limite
                      </span>
                    </div>
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
        <span>Planos compatíveis com seu perfil</span>
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
                    ? `Ate ${plano.idadeMaxima} anos`
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
      locked: true,
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
              if (!opt.disabled && !opt.locked) onToggle(opt.id);
            }}
            disabled={opt.disabled || opt.locked}
          >
            <div className="cm-cad-service-card-top">
              <div
                className={`cm-cad-plan-radio${checked || opt.locked ? " selected" : ""}`}
              >
                {(checked || opt.locked) && (
                  <div className="cm-cad-plan-radio-dot" />
                )}
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
            <span className="cm-cad-service-badge">
              {opt.locked ? "Incluso" : opt.badge}
            </span>
          </button>
        );
      })}
    </>
  );
}
void Step6Servicos;

/**
 * Componente interno para futura liberação do Clube de benefícios no cadastro.
 * Mantido por flag para não expor no fluxo público agora.
 */
function CadastroParceriasInternalPreview() {
  if (!ENABLE_PARCERIAS_CADASTRO) return null;
  return (
    <div className="cm-cad-dep-resumo-card">
      <div className="cm-cad-dep-resumo-main">
        <p className="cm-cad-dep-resumo-line">
          Clube de benefícios (preview interno)
        </p>
        <p className="cm-cad-conf-muted">
          Estrutura preparada para ativação futura sem impacto no fluxo atual.
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   Step 7 – Forma de pagamento
   ================================================================ */

function Step7Pagamento({
  metodo,
  onMetodoChange,
  creditCard,
  creditCardErrors,
  onCreditCardChange,
}: {
  metodo: MetodoPagamento | "";
  onMetodoChange: (value: MetodoPagamento) => void;
  creditCard: CreditCardValues;
  creditCardErrors: CreditCardErrors;
  onCreditCardChange: <K extends keyof CreditCardValues>(
    field: K,
    value: CreditCardValues[K],
  ) => void;
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

      {metodo === "CARTAO" && (
        <div className="cm-cad-card-form">
          <div className="cm-cad-card-info">
            <div className="cm-cad-card-info-title">
              <strong>Pagamento recorrente via cartão</strong>
              <CadastroSecurityTooltip />
            </div>
          </div>

          <Field
            label="Nome impresso no cartão"
            required
            error={creditCardErrors.holderName}
          >
            <input
              className={`cm-cad-input${creditCardErrors.holderName ? " error" : ""}`}
              value={creditCard.holderName}
              onChange={(event) =>
                onCreditCardChange("holderName", event.target.value)
              }
              autoComplete="cc-name"
              placeholder="Como está no cartão"
            />
          </Field>

          <Field
            label="CPF do portador"
            required
            error={creditCardErrors.holderCpf}
          >
            <input
              className={`cm-cad-input${creditCardErrors.holderCpf ? " error" : ""}`}
              value={creditCard.holderCpf}
              onChange={(event) =>
                onCreditCardChange("holderCpf", formatCPF(event.target.value))
              }
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
            />
          </Field>

          <Field
            label="Número do cartão"
            required
            error={creditCardErrors.number}
          >
            <input
              className={`cm-cad-input${creditCardErrors.number ? " error" : ""}`}
              value={creditCard.number}
              onChange={(event) =>
                onCreditCardChange(
                  "number",
                  formatCardNumber(event.target.value),
                )
              }
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
            />
          </Field>

          <div className="cm-cad-grid-two">
            <Field
              label="Mês"
              required
              half
              error={creditCardErrors.expiryMonth}
            >
              <input
                className={`cm-cad-input${creditCardErrors.expiryMonth ? " error" : ""}`}
                value={creditCard.expiryMonth}
                onChange={(event) =>
                  onCreditCardChange(
                    "expiryMonth",
                    formatCardExpiryMonth(event.target.value),
                  )
                }
                inputMode="numeric"
                autoComplete="cc-exp-month"
                placeholder="MM"
              />
            </Field>

            <Field
              label="Ano"
              required
              half
              error={creditCardErrors.expiryYear}
            >
              <input
                className={`cm-cad-input${creditCardErrors.expiryYear ? " error" : ""}`}
                value={creditCard.expiryYear}
                onChange={(event) =>
                  onCreditCardChange(
                    "expiryYear",
                    formatCardExpiryYear(event.target.value),
                  )
                }
                inputMode="numeric"
                autoComplete="cc-exp-year"
                placeholder="AAAA"
              />
            </Field>
          </div>

          <Field
            label="Código de segurança"
            required
            error={creditCardErrors.ccv}
          >
            <input
              className={`cm-cad-input${creditCardErrors.ccv ? " error" : ""}`}
              value={creditCard.ccv}
              onChange={(event) =>
                onCreditCardChange("ccv", formatCardCcv(event.target.value))
              }
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="CVV"
            />
          </Field>
        </div>
      )}

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
  step3,
  usarMesmosDados,
  dependentes,
  matrizTarifacaoDependente,
  plano,
  metodoPagamento,
  servicosAdicionais,
  consultorCode,
  onConsultorCodeChange,
  onResolveConsultor,
  consultorSelecionado,
  isConsultorLocked,
  isResolvingConsultor,
  consultorError,
  aceitouContrato,
  onAceitouContratoChange,
  contratoRef,
  aceitouTermos,
  onAceitouTermosChange,
  termosRef,
}: {
  step1: Partial<Step1Values>;
  step3: Partial<Step3Values>;
  usarMesmosDados: boolean;
  dependentes: Dependente[];
  matrizTarifacaoDependente: FaixaTarifacaoDependente[];
  plano: Plano | null;
  metodoPagamento: MetodoPagamento | "";
  servicosAdicionais: string[];
  consultorCode: string;
  onConsultorCodeChange: (value: string) => void;
  onResolveConsultor: () => void;
  consultorSelecionado: ConsultorPublicResult | null;
  isConsultorLocked: boolean;
  isResolvingConsultor: boolean;
  consultorError: string | null;
  aceitouContrato: boolean;
  onAceitouContratoChange: (v: boolean) => void;
  contratoRef: React.RefObject<HTMLDivElement | null>;
  aceitouTermos: boolean;
  onAceitouTermosChange: (v: boolean) => void;
  termosRef: React.RefObject<HTMLDivElement | null>;
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

  const adicionalCorresponsavel = useMemo(() => {
    if (usarMesmosDados) return 0;
    if (isResponsibleFinancialRelationshipWithoutAdditional(step3.parentesco)) {
      return 0;
    }
    return getAdicionalParticipantePorParentesco(
      {
        parentesco: step3.parentesco ?? "",
        dataNascimento: step3.dataNascimento ?? null,
        idade: step3.dataNascimento
          ? calcularIdade(step3.dataNascimento)
          : null,
      },
      matrizTarifacaoDependente,
    );
  }, [
    step3.parentesco,
    matrizTarifacaoDependente,
    step3.dataNascimento,
    usarMesmosDados,
  ]);

  const adicionalDependentesTotal = dependentes.reduce(
    (acc, dep) =>
      acc +
      getAdicionalParticipantePorParentesco(dep, matrizTarifacaoDependente),
    0,
  );

  const adicionalTotal = adicionalCorresponsavel + adicionalDependentesTotal;

  const totalMensalPlano = (plano?.valorMensal ?? 0) + adicionalTotal;

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
        <div className="flex flex-col gap-3">
          <input
            className={`cm-cad-input${consultorError ? " error" : ""}`}
            value={consultorCode}
            onChange={(ev) => onConsultorCodeChange(ev.target.value)}
            placeholder="Digite o código do consultor"
            disabled={isConsultorLocked || isResolvingConsultor}
          />
          <button
            type="button"
            className="cm-cad-btn cm-cad-btn-outline"
            onClick={onResolveConsultor}
            disabled={
              isConsultorLocked || isResolvingConsultor || !consultorCode.trim()
            }
          >
            {isResolvingConsultor ? "Validando..." : "Validar código"}
          </button>
          {consultorSelecionado ? (
            <ConsultorLookupCard
              consultor={consultorSelecionado}
              locked={isConsultorLocked}
            />
          ) : null}
        </div>
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
                  {adicionalTotal > 0 ? fmt(adicionalTotal) : "R$ 0,00"}
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
              matrizTarifacaoDependente,
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
        <CadastroParceriasInternalPreview />
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
              onClick={() => setPlanoModalOpen(false)}
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
                onClick={(ev) => ev.stopPropagation()}
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
                      {adicionalTotal > 0 ? fmt(adicionalTotal) : "R$ 0,00"}
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
                    Cobertura familiar:{" "}
                    <strong>
                      {formatCoberturaFamiliar(plano.coberturaMaxima)}
                    </strong>
                  </p>
                  {plano.idadeMaxima != null ? (
                    <p>
                      Faixa etária: <strong>{plano.idadeMaxima} anos</strong>
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

      <div ref={contratoRef} className="cm-cad-termos-row">
        <input
          id="cm-cad-contrato-check"
          type="checkbox"
          className="cm-cad-termos-checkbox"
          checked={aceitouContrato}
          onChange={(e) => onAceitouContratoChange(e.target.checked)}
        />
        <label htmlFor="cm-cad-contrato-check" className="cm-cad-termos-label">
          Li e concordo com o{" "}
          <a
            href="/docs/contrato.pdf"
            download="contrato-campo-bosque.pdf"
            className="cm-cad-termos-link"
            onClick={(e) => e.stopPropagation()}
          >
            Contrato de Prestação de Serviços
          </a>
          .
        </label>
      </div>

      <div ref={termosRef} className="cm-cad-termos-row">
        <input
          id="cm-cad-termos-check"
          type="checkbox"
          className="cm-cad-termos-checkbox"
          checked={aceitouTermos}
          onChange={(e) => onAceitouTermosChange(e.target.checked)}
        />
        <label htmlFor="cm-cad-termos-check" className="cm-cad-termos-label">
          Li e aceito a{" "}
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="cm-cad-termos-link"
            onClick={(e) => e.stopPropagation()}
          >
            Política de Privacidade
          </a>{" "}
          e os termos de uso do serviço.
        </label>
      </div>
    </>
  );
}

/* ================================================================
   WhatsApp Redirect Modal
   ================================================================ */

function buildWhatsAppUrl(
  numero: string,
  nome: string,
  cpf: string,
  dataNascimento: string,
  tipo: string,
): string {
  // Usa a mesma lógica de getWhatsAppFromPhone: remove o "9" após DDD em números de 11 dígitos
  const digits = numero.replace(/\D/g, "");
  let numWa = digits;
  if (digits.length === 11 && digits[2] === "9") {
    numWa = `${digits.slice(0, 2)}${digits.slice(3)}`;
  }
  const numCompleto = `55${numWa}`;
  const ddn = dataNascimento
    ? dataNascimento.split("-").reverse().join("/")
    : "";
  const msg = `Olá! Gostaria de continuar meu cadastro de ${tipo}.\n\nNome: ${nome}\nCPF: ${cpf}\nData de nascimento: ${ddn}`;
  return `https://wa.me/${numCompleto}?text=${encodeURIComponent(msg)}`;
}

function WhatsAppRedirectModal({
  nome,
  cpf,
  dataNascimento,
  tipo,
  numero,
  onClose,
}: {
  nome: string;
  cpf: string;
  dataNascimento: string;
  tipo: "Titular" | "Corresponsável";
  numero: string;
  onClose: () => void;
}) {
  const url = buildWhatsAppUrl(numero, nome, cpf, dataNascimento, tipo);
  return createPortal(
    <div
      className="cm-cad-wa-redirect-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-redirect-title"
    >
      <div className="cm-cad-wa-redirect-card">
        <button
          type="button"
          className="cm-cad-dep-modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M1 1L17 17M17 1L1 17"
              stroke="#595959"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="cm-cad-wa-redirect-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#25D366" fillOpacity="0.12" />
            <path
              d="M24 10C16.268 10 10 16.268 10 24c0 2.487.651 4.82 1.787 6.845L10 38l7.38-1.77A13.945 13.945 0 0024 38c7.732 0 14-6.268 14-14S31.732 10 24 10z"
              fill="#25D366"
            />
            <path
              d="M20.5 17.5c-.4-1-.8-1-.9-1h-.9c-.3 0-.8.1-1.2.6-.4.5-1.6 1.6-1.6 3.8 0 2.3 1.7 4.5 1.9 4.8.2.3 3.3 5.2 8.1 7.1 4 1.6 4.8 1.3 5.7 1.2.9-.1 2.8-1.1 3.2-2.2.4-1.1.4-2-.1-2.2-.2-.1-1.6-.7-3-1.4-1.4-.7-1.5-.6-2 .1-.5.7-.9 1.2-1.3 1.2-.2 0-.5-.1-.9-.3-.8-.5-2.4-1.6-3.5-3.5-.2-.3-.1-.5.1-.7.2-.2.5-.6.8-1 .3-.4.2-.7.1-1L20.5 17.5z"
              fill="white"
            />
          </svg>
        </div>

        <h2 id="wa-redirect-title" className="cm-cad-wa-redirect-title">
          Atendimento personalizado
        </h2>

        <p className="cm-cad-wa-redirect-body">
          Para a faixa de idade informada, o cadastro de <strong>{tipo}</strong>{" "}
          é realizado via atendimento humano.
          <br />
          Seus dados já serão enviados para agilizar o processo.
        </p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="cm-cad-wa-redirect-btn"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 1C5.029 1 1 5.029 1 10c0 1.66.435 3.218 1.197 4.566L1 19l4.572-1.185A9 9 0 1010 1z"
              fill="white"
            />
          </svg>
          Continuar pelo WhatsApp
        </a>

        <button
          type="button"
          className="cm-cad-wa-redirect-secondary"
          onClick={onClose}
        >
          Voltar ao cadastro
        </button>
      </div>
    </div>,
    document.body,
  );
}

/* ================================================================
   MobileCadastroScreen (root)
   ================================================================ */

export default function MobileCadastroScreen() {
  const isDev = process.env.NODE_ENV === "development";
  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aceitouContrato, setAceitouContrato] = useState(false);
  const contratoRef = useRef<HTMLDivElement>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const termosRef = useRef<HTMLDivElement>(null);
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
  const [usarMesmoEndereco, setUsarMesmoEndereco] = useState(false);
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
  const [matrizTarifacaoDependente, setMatrizTarifacaoDependente] = useState<
    FaixaTarifacaoDependente[]
  >(obterMatrizTarifacaoDependente(null, null));
  const [idadeMaximaDependente, setIdadeMaximaDependente] = useState<
    number | null
  >(null);

  /* Redirecionamento WhatsApp por idade */
  const [waRedirectAtivo, setWaRedirectAtivo] = useState(false);
  const [waRedirectNumero, setWaRedirectNumero] = useState<string | null>(null);
  const [waRedirectIdadeMin, setWaRedirectIdadeMin] = useState(18);
  const [waRedirectIdadeMax, setWaRedirectIdadeMax] = useState(65);
  const [waRedirectModal, setWaRedirectModal] = useState<{
    nome: string;
    cpf: string;
    dataNascimento: string;
    tipo: "Titular" | "Corresponsável";
  } | null>(null);

  /* Plano */
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [planoError, setPlanoError] = useState<string | null>(null);
  const [servicosAdicionais, setServicosAdicionais] = useState<string[]>([
    "clube-beneficios",
  ]);
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | "">(
    "",
  );
  const [creditCard, setCreditCard] = useState<CreditCardValues>({
    holderName: "",
    holderCpf: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
  });
  const [creditCardErrors, setCreditCardErrors] = useState<CreditCardErrors>(
    {},
  );

  /* Consultor */
  const [consultorCode, setConsultorCode] = useState("");
  const [consultorSelecionado, setConsultorSelecionado] =
    useState<ConsultorPublicResult | null>(null);
  const [consultorError, setConsultorError] = useState<string | null>(null);
  const [consultorFromQuery, setConsultorFromQuery] = useState<{
    codigo?: string;
    id: number;
    tenantId?: string;
  } | null>(null);
  const [isResolvingConsultor, setIsResolvingConsultor] = useState(false);

  useEffect(() => {
    if (currentStep !== 5) {
      setEditingDepIndex(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (metodoPagamento !== "CARTAO") return;
    const titular = step1Form.getValues();
    const responsavel = step3Form.getValues();
    const nomePadrao = String(
      responsavel.nomeCompleto || titular.nomeCompleto || "",
    ).trim();
    const cpfPadrao = formatCPF(
      String(responsavel.cpf || titular.cpf || "").replace(/\D/g, ""),
    );

    setCreditCard((prev) => ({
      ...prev,
      holderName: prev.holderName || nomePadrao,
      holderCpf: prev.holderCpf || cpfPadrao,
    }));
  }, [metodoPagamento, step1Form, step3Form]);

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

  const responsavelDataForPlanos = step3Form.watch();
  const parentescoResponsavelParaPlano = String(
    responsavelDataForPlanos.parentesco ?? "",
  ).trim();
  const incluirResponsavelNaComposicaoPlano =
    !usarMesmosDados &&
    isResponsibleFinancialRelationshipInPlan(parentescoResponsavelParaPlano);
  const participantesPayload = (() => {
    const list: ParticipanteMin[] = [
      {
        dataNascimento: step1DataForPlanos.dataNascimento ?? null,
        idade: step1DataForPlanos.dataNascimento
          ? calcularIdade(step1DataForPlanos.dataNascimento)
          : null,
        parentesco: "Titular",
      },
      ...(incluirResponsavelNaComposicaoPlano &&
      responsavelDataForPlanos.dataNascimento
        ? [
            {
              dataNascimento: responsavelDataForPlanos.dataNascimento ?? null,
              idade: responsavelDataForPlanos.dataNascimento
                ? calcularIdade(responsavelDataForPlanos.dataNascimento)
                : null,
              parentesco: parentescoResponsavelParaPlano || "Outro",
            } satisfies ParticipanteMin,
          ]
        : []),
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
    queryFn: () => fetchSuggestedPlanosWithRetry(participantesPayload),
    enabled: canSuggestPlanos,
    retry: false,
    staleTime: 60_000,
  });

  const planosCompativeis = useMemo(
    () => selecionarPlanosCompativeis(planosData, participantesPayload),
    [planosData, participantesPayload],
  );

  useEffect(() => {
    if (!Array.isArray(planosCompativeis) || planosCompativeis.length === 0) {
      setSelectedPlano(null);
      return;
    }

    setSelectedPlano((prev) => {
      if (
        prev &&
        planosCompativeis.some((p) => String(p.id) === String(prev.id))
      ) {
        return prev;
      }

      const maiorIdade = obterMaiorIdadeParticipantes(participantesPayload);
      return selecionarPlanoPorMaiorIdade(planosCompativeis, maiorIdade);
    });
  }, [planosCompativeis, participantesPayload]);

  useEffect(() => {
    if (isLoadingPlanos) return;
    if (planosCompativeis.length > 0) {
      setPlanoError((prev) =>
        prev ===
        "Nenhum plano compatível está disponível para o perfil cadastrado."
          ? null
          : prev,
      );
    }
  }, [isLoadingPlanos, planosCompativeis]);

  /* Fetch regras */
  useEffect(() => {
    api
      .get("/regras")
      .then((res) => {
        const regra = Array.isArray(res.data) ? res.data[0] : null;
        const limite = Number(regra?.limiteBeneficiarios);
        const valorAdicional = Number(regra?.valorAdicionalDependenteForaGrade);
        const matrizTarifacao = obterMatrizTarifacaoDependente(
          regra?.valorAdicionalDependenteForaGradeFaixasJson ?? null,
          valorAdicional,
        );
        const idadeMaximaRaw = regra?.idadeMaximaDependente;
        const idadeMaxima =
          idadeMaximaRaw === null || idadeMaximaRaw === undefined
            ? null
            : Number(idadeMaximaRaw);
        if (Number.isFinite(limite) && limite > 0) {
          setLimiteBeneficiarios(Math.min(limite, MAX_DEP));
        }
        if (
          idadeMaxima !== null &&
          Number.isFinite(idadeMaxima) &&
          idadeMaxima >= 0
        ) {
          setIdadeMaximaDependente(idadeMaxima);
        } else {
          setIdadeMaximaDependente(null);
        }
        setMatrizTarifacaoDependente(matrizTarifacao);

        // Regras de redirecionamento WhatsApp por idade
        if (regra?.redirecionamentoWhatsappAtivo) {
          setWaRedirectAtivo(true);
          setWaRedirectNumero(regra.redirecionamentoWhatsappNumero ?? null);
          const idadeMin = Number(regra.redirecionamentoWhatsappIdadeMin);
          const idadeMax = Number(regra.redirecionamentoWhatsappIdadeMax);
          if (Number.isFinite(idadeMin)) setWaRedirectIdadeMin(idadeMin);
          if (Number.isFinite(idadeMax)) setWaRedirectIdadeMax(idadeMax);
        }
      })
      .catch(() => {});
  }, []);

  /* Consultor from URL */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const codigo = normalizeConsultorCode(params.get("consultorCodigo"));
    const id = Number(params.get("consultorId"));
    const tenantId = params.get("consultorTenant")?.trim().toLowerCase();
    if (codigo) {
      setConsultorCode(codigo);
      setConsultorFromQuery({
        codigo,
        id: 0,
        tenantId: tenantId || undefined,
      });
      return;
    }
    if (Number.isFinite(id) && id > 0) {
      setConsultorFromQuery({
        codigo: undefined,
        id,
        tenantId: tenantId || undefined,
      });
    }
  }, []);

  const resolveConsultor = async (
    inputCode = consultorCode,
    legacy = consultorFromQuery,
  ) => {
    const normalizedCode = normalizeConsultorCode(inputCode);
    if (!normalizedCode && !(legacy?.id && legacy.tenantId)) {
      setConsultorSelecionado(null);
      setConsultorError("Informe o código do consultor.");
      return null;
    }

    setIsResolvingConsultor(true);
    try {
      const resolved = normalizedCode
        ? await resolveConsultorPublicByCode(normalizedCode)
        : await resolveConsultorPublicLegacy(legacy!.id, legacy!.tenantId!);
      if (!resolved) {
        setConsultorSelecionado(null);
        setConsultorError("Consultor não encontrado para o código informado.");
        return null;
      }
      setConsultorSelecionado(resolved);
      setConsultorCode(resolved.codigo);
      setConsultorError(null);
      return resolved;
    } catch {
      setConsultorSelecionado(null);
      setConsultorError("Consultor não encontrado para o código informado.");
      return null;
    } finally {
      setIsResolvingConsultor(false);
    }
  };

  useEffect(() => {
    if (!consultorFromQuery) return;
    void resolveConsultor(consultorFromQuery.codigo ?? "", consultorFromQuery);
  }, [consultorFromQuery]);

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

  /* WhatsApp redirect: check if age is outside allowed range */
  const checkIdadeRedirect = (
    dataNascimento: string,
    nome: string,
    cpf: string,
    tipo: "Titular" | "Corresponsável",
  ): boolean => {
    if (!waRedirectAtivo || !waRedirectNumero) return false;
    const idade = calcularIdade(dataNascimento);
    if (idade === null) return false;
    if (idade < waRedirectIdadeMin || idade > waRedirectIdadeMax) {
      setWaRedirectModal({ nome, cpf, dataNascimento, tipo });
      return true;
    }
    return false;
  };

  /* Dependentes validation */
  const validateDependentes = (deps: Dependente[]) => {
    const errors = deps.map((dep) => {
      const current = validateSingleDependente(dep);
      const idade =
        typeof dep.idade === "number" && Number.isFinite(dep.idade)
          ? dep.idade
          : calcularIdade(dep.dataNascimento ?? null);

      if (
        current.dataNascimento === undefined &&
        idade !== null &&
        idadeMaximaDependente !== null &&
        idade > idadeMaximaDependente
      ) {
        current.dataNascimento = `Dependente excede a idade máxima permitida de ${idadeMaximaDependente} anos`;
      }

      return current;
    });
    return {
      isValid: errors.every((e) => Object.keys(e).length === 0),
      errors,
    };
  };

  /* Validate current step */
  const validateCurrent = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1: {
        const ok = await step1Form.trigger(undefined, { shouldFocus: true });
        if (!ok) return false;
        if (!isDev) {
          const vals = step1Form.getValues();
          if (
            checkIdadeRedirect(
              vals.dataNascimento,
              vals.nomeCompleto,
              vals.cpf,
              "Titular",
            )
          )
            return false;
        }
        return true;
      }
      case 2:
        return await step2Form.trigger(undefined, { shouldFocus: true });
      case 3: {
        step3Form.setValue("usarMesmosDados", usarMesmosDados);
        if (usarMesmosDados) return true;
        const ok = await step3Form.trigger(
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
        if (!ok) return false;
        if (!isDev) {
          const vals = step3Form.getValues();
          if (
            vals.dataNascimento &&
            checkIdadeRedirect(
              vals.dataNascimento,
              vals.nomeCompleto ?? "",
              vals.cpf ?? "",
              "Corresponsável",
            )
          )
            return false;
        }
        return true;
      }
      case 4:
        if (usarMesmoEndereco) return true;
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
        if (planosCompativeis.length === 0) {
          setPlanoError(
            "Nenhum plano compatível está disponível para o perfil cadastrado.",
          );
          return false;
        }
        if (!selectedPlano) {
          setPlanoError("Selecione um plano compatível para continuar.");
          return false;
        }
        return true;
      case 7:
        return true;
      case 8:
        if (!metodoPagamento) return false;
        if (metodoPagamento === "CARTAO") {
          const errors = validateCreditCard(creditCard);
          setCreditCardErrors(errors);
          if (Object.keys(errors).length > 0) return false;
        }
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

  const handleCreditCardChange = <K extends keyof CreditCardValues>(
    field: K,
    value: CreditCardValues[K],
  ) => {
    setCreditCard((prev) => ({ ...prev, [field]: value }));
    setCreditCardErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: undefined };
    });
  };

  const handleFinish = async () => {
    if (!aceitouContrato) {
      contratoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      contratoRef.current?.classList.add("cm-cad-termos-highlight");
      setTimeout(
        () => contratoRef.current?.classList.remove("cm-cad-termos-highlight"),
        1800,
      );
      return;
    }
    if (!aceitouTermos) {
      termosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      termosRef.current?.classList.add("cm-cad-termos-highlight");
      setTimeout(
        () => termosRef.current?.classList.remove("cm-cad-termos-highlight"),
        1800,
      );
      return;
    }
    if (metodoPagamento === "CARTAO") {
      const errors = validateCreditCard(creditCard);
      setCreditCardErrors(errors);
      if (Object.keys(errors).length > 0) {
        setCurrentStep(8);
        return;
      }
    }
    const consultorVinculado =
      consultorSelecionado ?? (await resolveConsultor(consultorCode));
    if (!consultorVinculado) {
      return;
    }
    setSubmitError(null);
    try {
      const payload: CreateTitularInput = {
        consents: {
          privacyPolicyAccepted: aceitouTermos,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          serviceContractAccepted: aceitouContrato,
          serviceContractVersion: SERVICE_CONTRACT_VERSION,
          origin: CADASTRO_CONSENT_ORIGIN,
        },
        step1: step1Form.getValues(),
        step2: step2Form.getValues(),
        step3: { ...step3Form.getValues(), usarMesmosDados },
        step5: {
          planoId: selectedPlano ? Number(selectedPlano.id) : undefined,
          plano: selectedPlano,
          billingType:
            metodoPagamento === "CARTAO"
              ? "CREDIT_CARD"
              : metodoPagamento || undefined,
          creditCard:
            metodoPagamento === "CARTAO"
              ? {
                  holderName: creditCard.holderName.trim(),
                  holderCpf: creditCard.holderCpf,
                  number: creditCard.number,
                  expiryMonth: creditCard.expiryMonth,
                  expiryYear: creditCard.expiryYear,
                  ccv: creditCard.ccv,
                }
              : undefined,
        },
        servicosAdicionais,
        dependentes,
        usarMesmosDados,
        consultorId: consultorVinculado.id,
        consultorCodigo: consultorVinculado.codigo,
        consultorTenantId: consultorVinculado.tenantId,
        targetTenantId: consultorVinculado.tenantId,
      };
      await mutateAsync(payload);
    } catch (err: unknown) {
      const { message } = extractApiError(err);
      setSubmitError(message ?? "Erro ao finalizar cadastro.");
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
        return (
          <Step4AddressForm
            form={step3Form}
            ufValue={uf3}
            usarMesmoEndereco={usarMesmoEndereco}
            onToggleUsarMesmoEndereco={(checked) => {
              setUsarMesmoEndereco(checked);
              if (checked) {
                const addr = step2Form.getValues();
                step3Form.setValue("cep", addr.cep ?? "");
                step3Form.setValue("uf", addr.uf ?? "");
                step3Form.setValue("cidade", addr.cidade ?? "");
                step3Form.setValue("bairro", addr.bairro ?? "");
                step3Form.setValue("logradouro", addr.logradouro ?? "");
                step3Form.setValue("numero", addr.numero ?? "");
                step3Form.setValue("complemento", addr.complemento ?? "");
                step3Form.setValue(
                  "pontoReferencia",
                  addr.pontoReferencia ?? "",
                );
              }
            }}
          />
        );
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
            matrizTarifacaoDependente={matrizTarifacaoDependente}
            vagasJaConsumidas={usarMesmosDados ? 0 : 1}
          />
        );
      case 6:
        return (
          <Step5Plano
            planos={planosCompativeis}
            isLoading={isLoadingPlanos}
            selected={selectedPlano}
            onSelect={(p) => {
              setSelectedPlano(p);
              setPlanoError(null);
            }}
            error={planoError}
            selectionLocked={false}
          />
        );
      case 7:
        return (
          <Step6Servicos
            selected={servicosAdicionais}
            onToggle={(id) =>
              setServicosAdicionais((prev) =>
                prev.includes(id)
                  ? prev.filter((item) => item !== id)
                  : [...prev, id],
              )
            }
          />
        );
      case 8:
        return (
          <Step7Pagamento
            metodo={metodoPagamento}
            onMetodoChange={(value) => {
              setMetodoPagamento(value);
              setCreditCardErrors({});
            }}
            creditCard={creditCard}
            creditCardErrors={creditCardErrors}
            onCreditCardChange={handleCreditCardChange}
          />
        );
      case 9:
        return (
          <Step8Confirmacao
            step1={step1Form.getValues()}
            step3={step3Form.getValues()}
            usarMesmosDados={usarMesmosDados}
            dependentes={dependentes}
            matrizTarifacaoDependente={matrizTarifacaoDependente}
            plano={selectedPlano}
            metodoPagamento={metodoPagamento}
            servicosAdicionais={servicosAdicionais}
            consultorCode={consultorCode}
            onConsultorCodeChange={(value) => {
              setConsultorCode(normalizeConsultorCode(value));
              setConsultorSelecionado(null);
              setConsultorError(null);
            }}
            onResolveConsultor={() => {
              void resolveConsultor();
            }}
            consultorSelecionado={consultorSelecionado}
            isConsultorLocked={Boolean(consultorFromQuery)}
            isResolvingConsultor={isResolvingConsultor}
            consultorError={consultorError}
            aceitouContrato={aceitouContrato}
            onAceitouContratoChange={setAceitouContrato}
            contratoRef={contratoRef}
            aceitouTermos={aceitouTermos}
            onAceitouTermosChange={setAceitouTermos}
            termosRef={termosRef}
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

      {/* WhatsApp redirect modal */}
      {waRedirectModal && waRedirectNumero && (
        <WhatsAppRedirectModal
          nome={waRedirectModal.nome}
          cpf={waRedirectModal.cpf}
          dataNascimento={waRedirectModal.dataNascimento}
          tipo={waRedirectModal.tipo}
          numero={waRedirectNumero}
          onClose={() => setWaRedirectModal(null)}
        />
      )}
    </div>
  );
}

function CadastroSecurityTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="cm-security-tooltip-wrapper">
      <button
        type="button"
        className="cm-security-tooltip-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Informações de segurança"
      >
        ⓘ
      </button>
      {open && (
        <>
          <div
            className="cm-security-tooltip-backdrop"
            onClick={() => setOpen(false)}
          />
          <div className="cm-security-tooltip-box" role="tooltip">
            Seus dados são transmitidos com criptografia de ponta a ponta e
            armazenados com segurança pelo processador de pagamentos, em
            conformidade com o padrão PCI DSS.
          </div>
        </>
      )}
    </div>
  );
}
