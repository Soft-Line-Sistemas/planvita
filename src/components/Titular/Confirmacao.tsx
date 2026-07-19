"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plano } from "@/types/PlanType";
import { User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDatePtBr } from "@/utils/date";

interface PessoaResumo {
  nomeCompleto?: string;
  cpf?: string;
  dataNascimento?: string | null;
  sexo?: string;
  rg?: string;
  naturalidade?: string;
  situacaoConjugal?: string;
  profissao?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
}

interface EnderecoResumo {
  cep?: string;
  uf?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  complemento?: string;
  numero?: string;
  pontoReferencia?: string;
}

interface ResponsavelResumo extends PessoaResumo, EnderecoResumo {
  parentesco?: string;
}

interface ConfirmacaoProps {
  dados: {
    planoSelecionado?: Plano | null;
    titularDetalhes?: PessoaResumo;
    endereco?: EnderecoResumo;
    responsavelFinanceiro?: ResponsavelResumo;
    usarMesmosDados?: boolean;
    billingType?: "PIX" | "BOLETO" | "CREDIT_CARD";
    assinaturaTitularRegistrada?: boolean;
  };
  consultores: Array<{
    id: number;
    nome: string;
    tenantId: string;
    tenantLabel?: string;
    selectionKey: string;
  }>;
  selectedConsultorKey?: string;
  onSelectConsultor: (consultorKey: string) => void;
  isConsultorLocked?: boolean;
  isLoadingConsultores?: boolean;
  consultorError?: string | null;
}

const DEFAULT_TENANT_LABEL = "Campo do Bosque";

const TENANT_UNIT_LABELS: Record<string, string> = {
  bosque: "CAMPO DO BOSQUE",
  lider: "FUNERÁRIA LIDER",
  pax: "PAX LÍRIOS",
};

const escapeHtml = (value?: string | null) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatCurrencyBr = (value?: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDateBr = (value?: string | null) => {
  if (!value) return "";
  try {
    return formatDatePtBr(value);
  } catch {
    return value;
  }
};

const formatTodayBr = () =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

const firstName = (value?: string | null) => {
  const [first] = String(value ?? "")
    .trim()
    .split(/\s+/);
  return first ?? "";
};

const addressTypeFromLogradouro = (value?: string | null) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized.startsWith("av")) return "AVENIDA";
  if (normalized.startsWith("rod")) return "RODOVIA";
  if (normalized.startsWith("pra")) return "PRAÇA";
  return "RUA";
};

const getPlanModality = (plano?: Plano | null) => {
  const name = String(plano?.nome ?? "")
    .trim()
    .toLowerCase();
  if (name.includes("social")) return "social";
  if (name.includes("essencial")) return "essencial";
  if (name.includes("multi")) return "multi";
  if (name.includes("plus")) return "plus";
  return "";
};

const buildCoberturasText = (plano?: Plano | null) => {
  const coberturas = (plano?.coberturas ?? [])
    .map((item) => item.tipo?.trim() || item.descricao?.trim())
    .filter(Boolean);
  if (coberturas.length > 0) return coberturas.join(" | ");

  const beneficios = (plano?.beneficios ?? [])
    .map((item) => item.nome?.trim())
    .filter(Boolean);
  return beneficios.join(" | ");
};

const buildConsultorUnit = (tenantLabel?: string, tenantId?: string) => {
  const normalizedTenantId = String(tenantId ?? "")
    .trim()
    .toLowerCase();

  if (normalizedTenantId && TENANT_UNIT_LABELS[normalizedTenantId]) {
    return TENANT_UNIT_LABELS[normalizedTenantId];
  }

  const normalizedTenantLabel = String(tenantLabel ?? "")
    .trim()
    .toLowerCase();

  if (normalizedTenantLabel.includes("bosque"))
    return TENANT_UNIT_LABELS.bosque;
  if (normalizedTenantLabel.includes("lider")) return TENANT_UNIT_LABELS.lider;
  if (normalizedTenantLabel.includes("pax")) return TENANT_UNIT_LABELS.pax;

  if (tenantLabel?.trim()) return tenantLabel.trim().toUpperCase();
  if (tenantId?.trim()) return tenantId.trim().toUpperCase();
  return DEFAULT_TENANT_LABEL.toUpperCase();
};

const buildCheck = (checked: boolean, extraClass = "") =>
  `<span class="cb ${extraClass} ${checked ? "filled" : ""}"></span>`;

const buildRuledLine = (value?: string | null, tick = false) =>
  `<div class="ruled-line${tick ? " tick" : ""}"><span class="filled-text">${escapeHtml(value)}</span></div>`;

const buildIconBox = (pathMarkup: string, viewBox = "0 0 24 24") =>
  `<span class="icon-box"><svg viewBox="${viewBox}" aria-hidden="true">${pathMarkup}</svg></span>`;

const locationIcon = buildIconBox(
  '<path d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
);
const phoneIcon = buildIconBox(
  '<path d="M8.2 4.5h2.1l1 3.2-1.4 1.4a13 13 0 0 0 5.2 5.2l1.4-1.4 3.2 1v2.1c0 .7-.5 1.2-1.2 1.2A15.7 15.7 0 0 1 6.9 5.7c0-.7.6-1.2 1.3-1.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
);
const globeIcon = buildIconBox(
  '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.6 5.4 3.6 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.4 8.9 8.4 12s1.3 6.2 3.6 8.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
);
const mailIcon = buildIconBox(
  '<rect x="3.5" y="6" width="17" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m5.5 8 6.5 4.8L18.5 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
);

type SegmentedValueMode = "digits" | "alphanumeric" | "raw";

const normalizeSegmentedValue = (
  value: string | undefined,
  maxLength: number,
  mode: SegmentedValueMode = "digits",
) => {
  const rawValue = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!rawValue) return [];

  const normalized =
    mode === "digits"
      ? rawValue.replace(/\D/g, "")
      : mode === "alphanumeric"
        ? rawValue.replace(/[^0-9A-Z]/g, "")
        : rawValue;

  return normalized.slice(0, maxLength).split("");
};

const buildSegmentedLine = (
  value: string | undefined,
  groups: number[],
  className = "",
  options?: {
    mode?: SegmentedValueMode;
  },
) => {
  const totalSlots = groups.reduce((sum, groupSize) => sum + groupSize, 0);
  const characters = normalizeSegmentedValue(
    value,
    totalSlots,
    options?.mode ?? "digits",
  );
  let cursor = 0;

  const groupsMarkup = groups
    .map((groupSize, index) => {
      const slots = Array.from({ length: groupSize }, () => {
        const character = characters[cursor] ?? "&nbsp;";
        cursor += 1;
        return `<span class="slot"><span class="slot-char">${character === "&nbsp;" ? character : escapeHtml(character)}</span></span>`;
      }).join("");

      return `<div class="segmented-group" style="grid-template-columns:repeat(${groupSize}, minmax(0, 1fr)); flex:${groupSize} 1 0;">${slots}</div>${
        index < groups.length - 1 ? '<span class="group-separator"></span>' : ""
      }`;
    })
    .join("");

  return `<div class="segmented ${className}"><div class="segmented-content">${groupsMarkup}</div></div>`;
};

const buildAdesaoHtml = ({
  titular,
  endereco,
  responsavel,
  usarMesmosDados,
  plano,
  billingType,
  consultorNome,
  tenantLabel,
  assinaturaTitularRegistrada,
}: {
  titular?: PessoaResumo;
  endereco?: EnderecoResumo;
  responsavel?: ResponsavelResumo;
  usarMesmosDados?: boolean;
  plano?: Plano | null;
  billingType?: "PIX" | "BOLETO" | "CREDIT_CARD";
  consultorNome?: string;
  tenantLabel?: string;
  assinaturaTitularRegistrada?: boolean;
}) => {
  const today = formatTodayBr();
  const modality = getPlanModality(plano);
  const effectiveResponsavel = usarMesmosDados
    ? {
        nomeCompleto: titular?.nomeCompleto,
        cpf: titular?.cpf,
      }
    : responsavel;
  const fullAddress = [endereco?.logradouro, endereco?.complemento]
    .filter(Boolean)
    .join(", ");
  const phone = titular?.telefone || titular?.whatsapp || "";
  const planValue = formatCurrencyBr(plano?.valorMensal);
  const tenant = buildConsultorUnit(tenantLabel, undefined);
  const extensoes = buildCoberturasText(plano);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>ANEXO I - Proposta de Adesão | Campo do Bosque</title>
<style>
  :root{
    --verde-escuro:#40690B;
    --verde-musgo:#40690B;
    --verde-claro:#00A859;
    --verde-claro2:#B4D200;
    --vermelho:#ED3237;
    --preto:#1a1a1a;
    --cinza-linha:#2b2b2b;
    --bg:#ffffff;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    padding:0;
    background:#e9e9e9;
    font-family:'Segoe UI', Calibri, Arial, Helvetica, sans-serif;
    font-weight:400;
    color:var(--preto);
  }
  b, strong{font-weight:700;}
  .page{
    width:210mm;
    min-height:297mm;
    margin:10mm auto;
    background:#fff;
    padding:6mm 7mm;
    position:relative;
    box-shadow:0 0 8px rgba(0,0,0,0.25);
  }
  .header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    border-bottom:2px solid var(--preto);
    padding-bottom:4mm;
    margin-bottom:3mm;
  }
  .header-left h1{
    margin:0 0 1mm 0;
    font-size:22pt;
    font-weight:700;
    color:var(--verde-escuro);
    letter-spacing:0.5px;
  }
  .header-left p{
    margin:0;
    font-size:8.2pt;
    line-height:1.25;
    max-width:120mm;
  }
  .logo-img{
    height:16mm;
    width:auto;
    object-fit:contain;
  }
  .header-contact{
    display:flex;
    align-items:center;
    gap:2mm;
    margin-top:1mm;
  }
  .qr-img{
    width:16mm;
    height:16mm;
    object-fit:contain;
    image-rendering:pixelated;
    flex-shrink:0;
  }
  .contact-text .ct-title{
    font-size:8.5pt;
    font-weight:700;
    color:var(--verde-escuro);
    margin:0;
  }
  .contact-text .ct-phone{
    font-size:15pt;
    font-weight:700;
    color:var(--verde-escuro);
    margin:0;
    line-height:1.1;
  }
  .top-fields{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:2mm 6mm;
    margin-bottom:3mm;
  }
  .field{display:flex; flex-direction:column;}
  .field-label{
    font-size:7.5pt;
    font-weight:700;
    color:var(--preto);
    margin-bottom:0.8mm;
    display:block;
  }
  .ruled-line{
    border:none;
    border-bottom:1.4px solid var(--cinza-linha);
    height:5mm;
    position:relative;
  }
  .ruled-line.tick{border-left:2px solid var(--verde-claro); padding-left:2mm;}
  .filled-text{
    position:absolute;
    left:2mm;
    right:1mm;
    bottom:.35mm;
    font-size:8pt;
    font-weight:700;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .segmented{
    display:inline-flex;
    align-items:stretch;
    align-self:flex-start;
    border-bottom:1.4px solid var(--cinza-linha);
    height:6.2mm;
    position:relative;
    width:100%;
  }
  .segmented::before{
    content:"";
    position:absolute;
    left:0;
    bottom:0;
    width:2px;
    height:100%;
    background:var(--verde-claro);
  }
  .segmented.no-tick::before{content:none;}
  .segmented-content{
    display:flex;
    align-items:stretch;
    width:100%;
    height:100%;
    position:relative;
  }
  .segmented.end-bar .segmented-content::after{
    content:"";
    position:absolute;
    right:0;
    bottom:0;
    height:85%;
    border-right:1.6px solid var(--cinza-linha);
  }
  .segmented.start-bar .segmented-content::before{
    content:"";
    position:absolute;
    left:0;
    bottom:0;
    height:85%;
    border-left:1.6px solid var(--cinza-linha);
  }
  .segmented-group{
    display:grid;
    align-items:stretch;
    min-width:0;
    height:100%;
  }
  .slot{
    display:flex;
    align-items:flex-end;
    justify-content:center;
    min-width:0;
    height:100%;
    padding:0 0.2mm 0.45mm;
    position:relative;
  }
  .slot::after{
    content:"";
    position:absolute;
    right:0;
    bottom:0;
    height:12%;
    border-right:1.2px solid var(--cinza-linha);
  }
  .segmented-group .slot:last-child::after{content:none;}
  .slot-char{
    display:block;
    font-size:10pt;
    font-weight:800;
    line-height:1;
  }
  .group-separator{
    flex:0 0 1.1mm;
    height:85%;
    align-self:flex-end;
    border-right:1.6px solid var(--cinza-linha);
  }
  .checks-row{
    display:flex;
    gap:4mm;
    align-items:center;
    font-size:8pt;
    font-weight:700;
    margin-top:1mm;
    flex-wrap:wrap;
  }
  .checkbox{
    display:inline-flex;
    align-items:center;
    gap:1.2mm;
  }
  .cb{
    width:3mm;
    height:3mm;
    border:1.3px solid #333;
    border-radius:0.7mm;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    font-size:2.2mm;
    line-height:1;
    font-weight:700;
  }
  .cb.filled::after{content:"✓";}
  .cb.round{border-radius:0.7mm;}
  .cb.oval{
    width:5mm;
    height:3.2mm;
    border-radius:0.8mm;
  }
  .section-bar{
    background:var(--verde-musgo);
    color:#fff;
    font-size:10pt;
    font-weight:700;
    padding:1.6mm 3mm;
    margin:3mm 0 2mm 0;
    letter-spacing:0.3px;
  }
  .sec1-block{padding:0 1mm 2mm 1mm;}
  .checks-inline{
    display:flex;
    flex-direction:column;
    gap:0.5mm;
    font-size:7.6pt;
    font-weight:700;
  }
  .field-with-checks{
    display:flex;
    gap:4mm;
    align-items:flex-start;
  }
  .row-grid{
    display:grid;
    gap:3mm 6mm;
    margin-bottom:2mm;
  }
  .row-grid.g4{grid-template-columns:1fr 1fr 1fr 0.5fr;}
  .summary-item{
    display:flex;
    align-items:flex-start;
    gap:2.5mm;
    padding:1.3mm 1mm;
    border-bottom:0.5px solid #ddd;
  }
  .summary-item .cb{margin-top:1mm; flex-shrink:0;}
  .summary-item .txt strong{
    font-size:8pt;
    display:block;
    margin-bottom:0.5mm;
  }
  .summary-item .txt span{
    font-size:7.6pt;
    line-height:1.35;
  }
  .composicao-grid{
    display:grid;
    grid-template-columns:1fr 1fr 1fr 1.3fr auto;
    gap:4mm;
    padding:2mm 1mm;
    align-items:end;
  }
  .pay-checks{
    display:flex;
    flex-direction:column;
    gap:1mm;
    font-size:7.5pt;
    font-weight:700;
  }
  .sec7-row{
    display:flex;
    align-items:flex-end;
    gap:5mm;
    padding:2mm 1mm 3mm 1mm;
  }
  .sec7-row .checks-inline{min-width:26mm;}
  .sec7-row .field{flex:1;}
  .sec7-row .field.cpf{flex:0 0 45mm;}
  .p2-topbar{
    background:#000;
    color:#fff;
    font-size:11pt;
    font-weight:700;
    padding:2mm 3mm;
    margin-bottom:2mm;
  }
  .info-cols{
    display:grid;
    grid-template-columns:0.85fr 2fr;
    border:1.2px solid #000;
    margin-bottom:2mm;
  }
  .info-cols .col{padding:1.5mm 2.5mm; font-size:7.3pt; line-height:1.35;}
  .info-cols .col1{border-right:1.2px solid #000; color:var(--vermelho);}
  .info-cols .col1 div:first-child{font-weight:700; margin-bottom:0.5mm;}
  .parties-box{
    border:1.2px solid #000;
    border-top:none;
    padding:1.5mm 2.5mm;
    font-size:7.3pt;
    line-height:1.35;
    margin-bottom:2mm;
  }
  .composicao-text{
    font-size:8.3pt;
    line-height:1.55;
    text-align:justify;
    margin-bottom:2mm;
  }
  .black-bar{
    background:#000;
    color:#fff;
    font-size:10pt;
    font-weight:700;
    padding:1.8mm 3mm;
    margin:2mm 0;
  }
  .body-text{
    font-size:8.3pt;
    line-height:1.5;
    font-weight:700;
    margin-bottom:2mm;
  }
  .modalidade-check{
    display:flex;
    align-items:center;
    gap:2.5mm;
    font-size:8.3pt;
    font-weight:700;
    margin-bottom:2.5mm;
  }
  .recibo-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:0;
    margin-top:1mm;
  }
  .recibo-cell{
    padding:5mm 3mm 6mm 3mm;
    border-bottom:1px solid #000;
    min-height:18mm;
  }
  .recibo-cell.br{border-right:1px solid #000;}
  .recibo-label{font-size:7.8pt; font-weight:700;}
  .recibo-note{
    margin-top:3mm;
    font-size:7.2pt;
    line-height:1.35;
    color:#333;
  }
  .rs-row{
    display:flex;
    align-items:flex-end;
    gap:4mm;
    margin-top:3mm;
  }
  .rs-box{
    font-size:11pt;
    font-weight:700;
    border-bottom:1.4px solid #000;
    padding:1mm 2mm;
    width:45mm;
    height:8mm;
  }
  .brand-footer{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-top:4mm;
    border-top:1px solid #ccc;
    padding-top:3mm;
    font-size:7pt;
    gap:5mm;
  }
  .brands{
    display:flex;
    align-items:center;
    gap:4mm;
  }
  .sindef-img{
    height:9mm;
    width:auto;
    filter:grayscale(1) brightness(0.4);
  }
  .pax-img{
    height:9mm;
    width:auto;
    filter:grayscale(1) brightness(0.35);
  }
  .pix-logo{
    height:7mm;
    width:auto;
  }
  .bank-info{
    font-size:7pt;
    line-height:1.4;
    font-weight:700;
  }
  .bb-logo{
    display:flex;
    align-items:center;
  }
  .bb-logo-img{
    height:9mm;
    width:auto;
    filter:grayscale(1) brightness(0.4);
  }
  .contact-footer{
    text-align:right;
    font-size:7pt;
    line-height:1.5;
  }
  .icon-box{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    width:4mm;
    height:4mm;
    background:#1a1a1a;
    border-radius:0.7mm;
    color:#fff;
  }
  .icon-box svg{
    width:2.7mm;
    height:2.7mm;
    display:block;
  }
  .side-code{
    position:absolute;
    left:2mm;
    bottom:8mm;
    writing-mode:vertical-rl;
    font-size:6.5pt;
    color:#666;
    letter-spacing:1px;
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>ANEXO I - PROPOSTA DE ADESÃO</h1>
      <p>PARTE INTEGRANTE DAS CONDIÇÕES GERAIS DO CONTRATO DE<br>
      ASSISTÊNCIA FUNERAL CAMPO DO BOSQUE - LEI Nº 13.261/16</p>
    </div>
    <div>
      <img class="logo-img" src="/adesao-cb/logo.png" alt="Campo do Bosque">
    </div>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:3mm;">
    <div class="top-fields" style="flex:1;">
      <div class="field">
        <span class="field-label">UNIDADE</span>
        ${buildRuledLine(tenant, true)}
      </div>
      <div class="field">
        <span class="field-label">DATA DA ADESÃO</span>
        ${buildSegmentedLine(today, [2, 2, 4], "end-bar")}
      </div>
      <div class="field">
        <span class="field-label">PROMOTOR (A) COMERCIAL</span>
        ${buildRuledLine(consultorNome, true)}
      </div>
      <div class="field">
        <span class="field-label">CANAL DE VENDAS</span>
        <div class="checks-row" style="margin-top:2mm;">
          <span class="checkbox">${buildCheck(false, "round")}PAP</span>
          <span class="checkbox">${buildCheck(true, "round")}WEB</span>
          <span class="checkbox">${buildCheck(false, "round")}UND</span>
          <span class="checkbox">${buildCheck(false, "round")}PRO</span>
          <span class="checkbox">${buildCheck(false, "round")}IND</span>
        </div>
      </div>
    </div>
    <div class="header-contact">
      <img class="qr-img" src="/adesao-cb/qr-whatsapp.png" alt="QR WhatsApp">
      <div class="contact-text">
        <p class="ct-title">Central de Atendimento</p>
        <p class="ct-phone">71<br>3266 0787</p>
      </div>
    </div>
  </div>

  <div class="section-bar">1. QUALIFICAÇÃO DO PROPONENTE TITULAR (CONTRATANTE)</div>
  <div class="sec1-block">
    <div class="field-with-checks" style="margin-bottom:2mm;">
      <div class="checks-inline">
        <span class="checkbox">${buildCheck(true, "round")}P FÍSICA</span>
        <span class="checkbox">${buildCheck(false, "round")}P JURÍDICA</span>
      </div>
      <div style="flex:1;">
        <span class="field-label">NOME COMPLETO <span style="font-weight:400;">(não abreviar o primeiro e o último nome)</span></span>
        ${buildRuledLine(titular?.nomeCompleto)}
      </div>
      <div class="checks-inline">
        <span class="checkbox">${buildCheck(
          titular?.sexo === "Masculino",
          "round",
        )}MAS</span>
        <span class="checkbox">${buildCheck(
          titular?.sexo === "Feminino",
          "round",
        )}FEM</span>
      </div>
    </div>

    <div style="display:flex; gap:4mm; align-items:flex-end; margin-bottom:2mm;">
      <div class="field" style="flex:1.4;">
        <span class="field-label">DATA DE NASCIMENTO</span>
        ${buildSegmentedLine(
          formatDateBr(titular?.dataNascimento),
          [2, 2, 4],
          "end-bar",
        )}
      </div>
      <div class="field" style="flex:0 0 auto; min-width:48mm;">
        <span class="field-label">CPF</span>
        ${buildSegmentedLine(titular?.cpf, [3, 3, 3, 2], "end-bar")}
      </div>
      <div class="field" style="flex:0 0 auto; min-width:24mm;">
        <span class="field-label">RG</span>
        ${buildRuledLine(titular?.rg, true)}
      </div>
    </div>

    <div style="display:flex; gap:4mm; margin-bottom:2mm; align-items:flex-end;">
      <div style="flex:0.58;">
        <span class="field-label">CONTATOS</span>
        <div class="checks-inline">
          <span class="checkbox">${buildCheck(Boolean(titular?.whatsapp), "round")}WHATSAPP</span>
          <span class="checkbox">${buildCheck(Boolean(titular?.telefone), "round")}LIGAÇÃO</span>
        </div>
      </div>
      <div style="flex:0 0 auto; min-width:58mm;">
        <span class="field-label">TELEFONE</span>
        ${buildSegmentedLine(phone, [2, 5, 4], "end-bar")}
      </div>
      <div style="flex:1;">
        <span class="field-label">PREFERÊNCIA DE TRATAMENTO / COMO É CONHECIDO</span>
        ${buildRuledLine(firstName(titular?.nomeCompleto))}
      </div>
    </div>

    <div style="display:flex; gap:4mm; margin-bottom:2mm; align-items:flex-end;">
      <div style="flex:1.6;">
        <span class="field-label">ENDEREÇO DE MORADA HABITUAL</span>
        <div class="checks-inline" style="flex-direction:row; gap:4mm; margin-bottom:1mm;">
          <span class="checkbox">${buildCheck(
            addressTypeFromLogradouro(endereco?.logradouro) === "RUA",
            "round",
          )}RUA</span>
          <span class="checkbox">${buildCheck(
            addressTypeFromLogradouro(endereco?.logradouro) === "PRAÇA",
            "round",
          )}PRAÇA</span>
          <span class="checkbox">${buildCheck(
            addressTypeFromLogradouro(endereco?.logradouro) === "AVENIDA",
            "round",
          )}AVENIDA</span>
          <span class="checkbox">${buildCheck(
            addressTypeFromLogradouro(endereco?.logradouro) === "RODOVIA",
            "round",
          )}RODOVIA</span>
        </div>
        ${buildRuledLine(fullAddress)}
      </div>
      <div class="field" style="flex:0.5;">
        <span class="field-label">Nº</span>
        ${buildRuledLine(endereco?.numero, true)}
      </div>
    </div>

    <div class="row-grid g4">
      <div class="field">
        <span class="field-label">CEP</span>
        ${buildSegmentedLine(endereco?.cep, [5, 3], "end-bar")}
      </div>
      <div class="field">
        <span class="field-label">BAIRRO / DISTRITO</span>
        ${buildRuledLine(endereco?.bairro, true)}
      </div>
      <div class="field">
        <span class="field-label">CIDADE</span>
        ${buildRuledLine(endereco?.cidade, true)}
      </div>
      <div class="field">
        <span class="field-label">UF</span>
        ${buildRuledLine(endereco?.uf, true)}
      </div>
    </div>
  </div>

  <div class="section-bar">2. RESUMO DA ASSISTÊNCIA | OBJETO DO CONTRATO</div>
  <div class="summary-item">
    ${buildCheck(modality === "social")}
    <div class="txt">
      <strong>MODALIDADE SOCIAL | ASSISTÊNCIA OBJETO DO CONTRATO</strong>
      <span>A1) VEÍCULO FUNERAL | A2) URNA SEXTAVADA | A3) VESTIMENTA | A4) PARAMENTOS DE VELÓRIO | A5) TRASLADO LOCAL | A6) SEPULTAMENTO E TAXAS DE SERVIÇOS | EM CEMITÉRIO PÚBLICO</span>
    </div>
  </div>
  <div class="summary-item">
    ${buildCheck(["essencial", "multi", "plus"].includes(modality))}
    <div class="txt">
      <strong>MODALIDADE ESSENCIAL, MULTI OU PLUS | ASSISTÊNCIA OBJETO DO CONTRATO</strong>
      <span>A1) VEÍCULO FUNERAL | A2) URNA SEXTAVADA | A3) VESTIMENTA | A4) PARAMENTOS DE VELÓRIO | A5) TRASLADO LOCAL | A6) SEPULTAMENTO E TAXAS DE SERVIÇOS | EM CEMITÉRIO PÚBLICO | A7) 01 CORA DE FLORES</span>
    </div>
  </div>

  <div class="section-bar">3. RESUMO DOS BENEFÍCIOS COMPLEMENTARES</div>
  <div class="summary-item">
    ${buildCheck(["social", "essencial", "multi"].includes(modality))}
    <div class="txt">
      <strong>MODALIDADE SOCIAL, ESSENCIAL OU MULTI</strong>
      <span>B1) TRANSPORTE COLETIVO | 01 VAN OU 01 MICRO-ÔNIBUS | B2) ORIENTAÇÃO PSICOSSOCIAL | B3) SERVIÇO DE COPA&amp;CAFÉ</span>
    </div>
  </div>
  <div class="summary-item">
    ${buildCheck(modality === "plus")}
    <div class="txt">
      <strong>MODALIDADE PLUS</strong>
      <span>B1) TRANSPORTE COLETIVO | 01 VAN OU 01 MICRO-ÔNIBUS | B2) ORIENTAÇÃO PSICOSSOCIAL | B3) SERVIÇO DE COPA&amp;CAFÉ | B4) ACOLHIMENTO PSICOSSOCIAL | B5) OPÇÃO DE CREMAÇÃO</span>
    </div>
  </div>

  <div class="section-bar">4. RESUMO DAS COBERTURAS ADICIONAIS</div>
  <div class="summary-item">
    ${buildCheck(Boolean(plano))}
    <div class="txt">
      <strong>MODALIDADE SOCIAL, ESSENCIAL, MULTI OU PLUS</strong>
      <span>C1) AUXÍLIO FINANCEIRO DE ATÉ 20 VEZES A MENSALIDADE | C2) ATENDIMENTO NACIONAL | C3) LEMBRANÇA ON-LINE</span>
    </div>
  </div>

  <div class="section-bar">5. RESUMO DOS DIFERENCIAIS</div>
  <div class="summary-item">
    ${buildCheck(["social", "essencial"].includes(modality))}
    <div class="txt">
      <strong>MODALIDADE SOCIAL OU ESSENCIAL</strong>
      <span>D1) SORTEIO SEMANAL | D2) PAGAMENTO ON-LINE E CLUBE FIDELIDADE</span>
    </div>
  </div>
  <div class="summary-item">
    ${buildCheck(["multi", "plus"].includes(modality))}
    <div class="txt">
      <strong>MODALIDADE MULTI OU PLUS</strong>
      <span>D1) SORTEIO SEMANAL | D2) PAGAMENTO ON-LINE E CLUBE FIDELIDADE | D3) ASSISTENCIA PET</span>
    </div>
  </div>

  <div class="section-bar">6. COMPOSIÇÃO DA MENSALIDADE DO PLANO</div>
  <div class="composicao-grid">
    <div class="field">
      <span class="field-label">VALOR DO PLANO PADRÃO</span>
      ${buildRuledLine(planValue, true)}
    </div>
    <div class="field">
      <span class="field-label">COBERTURAS ESTENDIDAS</span>
      ${buildRuledLine(extensoes, true)}
    </div>
    <div class="field">
      <span class="field-label">MENSALIDADE</span>
      ${buildRuledLine(planValue, true)}
    </div>
    <div class="field">
        <span class="field-label">DATA PRIMEIRO PAGTO / ADESÃO</span>
      ${buildSegmentedLine(today, [2, 2, 4], "end-bar")}
    </div>
    <div class="pay-checks">
      <span class="checkbox">${buildCheck(billingType === "PIX", "round")}PIX</span>
      <span class="checkbox">${buildCheck(billingType === "BOLETO", "round")}BOLETO</span>
      <span class="checkbox">${buildCheck(
        billingType === "CREDIT_CARD",
        "round",
      )}CARTÃO C/D</span>
      <span class="checkbox">${buildCheck(false, "round")}RECEBIMENTO</span>
    </div>
  </div>

  <div class="section-bar">7. CORRESPONSÁVEL/RESPONSÁVEL FINANCEIRO</div>
  <div class="sec7-row">
    <div class="checks-inline">
      <span class="checkbox">${buildCheck(Boolean(usarMesmosDados), "round")}TITULAR</span>
      <span class="checkbox">${buildCheck(!usarMesmosDados, "round")}OUTRO</span>
    </div>
    <div class="field">
      <span class="field-label">NOME COMPLETO</span>
      ${buildRuledLine(effectiveResponsavel?.nomeCompleto)}
    </div>
    <div class="field cpf">
      <span class="field-label">CPF</span>
      ${buildSegmentedLine(effectiveResponsavel?.cpf, [3, 3, 3, 2], "end-bar")}
    </div>
  </div>
</div>

<div class="page">
  <span class="side-code">CCAMKT2023</span>
  <div class="p2-topbar">8. RESUMO DAS CONDIÇÕES GERAIS DO CONTRATO DE ADESÃO - PRESTAÇÃO DE SERVIÇO FUNERAL FUTURO</div>

  <div class="info-cols">
    <div class="col col1">
      <div>REGISTRO DAS CONDIÇÕES GERAIS</div>
      <div>CONTRATO REGISTRADO SOB Nº821473</div>
      <div>SERVIÇO NOTARIAL - SALVADOR - BA</div>
    </div>
    <div class="col col2">
      <b>BASE DO CONTRATO / CONDIÇÕES GERAIS</b>: CONTRATO DE ADESÃO - PRESTAÇÃO DE SERVIÇO PARA ASSISTÊNCIA FUNERAL
      MODALIDADE PREVENTIVO - CÓDIGO DEFESA DO CONSUMIDOR (LEI Nº 8.078) - ESTATUTO DO IDOSO (LEI Nº 10.741/2003)
      - LEI GERAL DE PROTEÇÃO DE DADOS ( LEI Nº 13.709/2018 - REGULAMENTAÇÃO DE PLANOS FUNERÁRIOS (LEI Nº 13.261/16)
      DECLARAÇÕES DO TITULAR AO PROMOTOR DE VENDAS DESCRITAS NESTE ANEXO E NO APLICATIVO DE ADESÃO.
    </div>
  </div>

  <div class="parties-box">
    <b>PARTES DO CONTRATO:</b> COMO CONTRATADO - CAMPO DO BOSQUE LTDA - CNPJ 51.121.484/0001-68 - COM SEDE NA AV CENTENÁRIO, 21 - GARCIA - SALVADOR -BA
    CEP: 40.100-180 - PESSOA JURÍDICA DE DIREITO PRIVADO E REGULARMENTE QUALIFICADA PARA A ADMINISTRAÇÃO DE PLANOS FUNERÁRIOS COM OPERAÇÃO PRÓPRIA OU
    ATRAVÉS DE PLATAFORMA CREDENCIADA. COMO CONTRATANTE, O PROPONENTE TITULAR QUALIFICADO NO ITEM 1 NO VERSO
  </div>

  <div class="composicao-text">
    <b>COMPOSIÇÃO DA ASSISTÊNCIA QUANDO REALIZADA DIRETAMENTE PELA CONTRATADA EM SUA ÁREA DE ABRANGÊNCIA:</b> 1.
    <b>CENTRAL DE ATENDIMENTO:</b> PRESENCIAL NOS ENDEREÇOS DAS UNIDADES DE ATENDIMENTO DURANTE O EXPEDIENTE
    COMERCIAL DE SEG/SEX E TELEFÔNICO NO PLANTÃO DE ATENDIMENTO: 71. 3066.0787. <b>2. ORIENTAÇÃO FAMILIAR:</b>
    PROFISSIONAL PARA AUXILIAR NOS TRÂMITES BUROCRÁTICOS E DOCUMENTAÇÃO LEGAL E LOGÍSTICA DE LOCAL E HORÁRIO
    DA CERIMÔNIA, CORTEJO E SEPULTAMENTO. <b>PLANO SELECIONADO:</b> ${
      escapeHtml(plano?.nome) || "NÃO INFORMADO"
    }.
  </div>

  <div class="black-bar">9. ACEITAÇÃO E ENTENDIMENTO DAS CONDIÇÕES DE ADESÃO AO PLANO</div>
  <div class="body-text">
    IMPORTANTE: ANTES DE VOCÊ ASSINAR A SUA ADESÃO, CONFIRME NO SEU CELULAR O RECEBIMENTO DO GUIA DO CLIENTE
    E CONDIÇÕES GERAIS. PERMITA QUE O PROMOTOR FAÇA REGISTRO DIGITAL DE DOCUMENTOS E DA PROPOSTA DE ADESÃO.
  </div>

  <div class="black-bar">10. VALIDAÇÃO DA SUA ADESÃO E INCLUSÃO DE DEPENDENTES AO PLANO</div>
  <div class="body-text">
    EM ATÉ 48H VOCÊ RECEBERÁ A CONFIRMAÇÃO DO SEU PLANO. PARA A INCLUSÃO DOS DEPENDENTES VOCÊ PODERÁ FAZER
    A QUALQUER TEMPO DURANTE A VIGÊNCIA DO CONTRATO PELA CENTRAL DE ATENDIMENTO AO CLIENTE.
  </div>

  <div class="modalidade-check">${buildCheck(modality === "social", "oval")} MODALIDADE SOCIAL: CÔNJUGE ATÉ A IDADE DE 55 ANOS - FILHOS, NETOS E ENTEADOS DO TITULAR</div>
  <div class="modalidade-check">${buildCheck(modality === "essencial", "oval")} MODALIDADE ESSENCIAL: CÔNJUGE ATÉ A IDADE DE 65 ANOS - FILHOS, NETOS E ENTEADOS - PAI E MÃE DO TITULAR</div>
  <div class="modalidade-check">${buildCheck(modality === "multi", "oval")} MODALIDADE MULTI: CÔNJUGE - FILHOS, NETOS E ENTEADOS - PAI E MÃE - SOGRO E SOGRA DO TITULAR</div>
  <div class="modalidade-check">${buildCheck(modality === "plus", "oval")} MODALIDADE PLUS: CÔNJUGE - FILHOS, NETOS E ENTEADOS - PAI E MÃE (OU SOGRO E SOGRA DO TITULAR)</div>

  <div class="black-bar">RECIBO DA ADESÃO (PRIMEIRA MENSALIDADE DO PLANO)</div>
  <div class="recibo-grid">
    <div class="recibo-cell br">
      <span class="recibo-label">ASSINATURA</span>
      ${
        assinaturaTitularRegistrada
          ? '<div class="recibo-note">Assinatura digital ao final desse documento</div>'
          : ""
      }
    </div>
    <div class="recibo-cell"><span class="recibo-label">DATA E LOCAL</span><div style="margin-top:3mm; font-size:8pt; font-weight:700;">${escapeHtml(
      `${today} - Salvador/BA`,
    )}</div></div>
    <div class="recibo-cell br"><span class="recibo-label">TESTEMUNHA / NOME / CPF</span></div>
    <div class="recibo-cell"><span class="recibo-label">ASSINATURA</span></div>
  </div>

  <div class="rs-row">
    <span style="font-size:11pt; font-weight:700;">R$</span>
    <div class="rs-box">${escapeHtml(planValue.replace("R$", "").trim())}</div>
    <img class="qr-img" style="margin-left:10mm;" src="/adesao-cb/qr-pix.png" alt="QR Pix">
    <img class="pix-logo" src="/adesao-cb/pix-banco-central.svg" alt="Pix">
    <div class="bb-logo" style="margin-left:2mm;"><img class="bb-logo-img" src="/adesao-cb/banco-do-brasil.png" alt="Banco do Brasil"></div>
    <div class="bank-info" style="margin-left:2mm;">
      AG:3439-5<br>
      C/c 53245-2<br>
      CHAVE PIX: 51121484000168<br>
      PLANO FAMILIAR CAMPO DO BOSQUE LTDA
    </div>
  </div>

  <div class="brand-footer">
    <div class="brands">
      <img class="logo-img" src="/adesao-cb/logo.svg" alt="Campo do Bosque" style="height:9mm;">
      <img class="sindef-img" src="/adesao-cb/sindef.png" alt="Sindef BA">
      <img class="pax-img" src="/adesao-cb/pax.png" alt="Pax">
    </div>
    <div class="contact-footer">
      ${locationIcon} AV. CENTENÁRIO, 21 - CEP: 40.100-180 - GARCIA &nbsp; ${phoneIcon} 71 3266-0787<br>
      SALVADOR - BA<br>
      ${globeIcon} www.CAMPODOBOSQUE.com.br &nbsp; ${mailIcon} atendimento@campodobosque.com.br
    </div>
  </div>
</div>
</body>
</html>`;
};

export function Confirmacao({
  dados,
  consultores,
  selectedConsultorKey,
  onSelectConsultor,
  isConsultorLocked = false,
  isLoadingConsultores = false,
  consultorError = null,
}: ConfirmacaoProps) {
  const consultorSelecionadoNoLink =
    Boolean(selectedConsultorKey) &&
    !consultores.some((item) => item.selectionKey === selectedConsultorKey);

  const consultoresDisponiveis = consultorSelecionadoNoLink
    ? [
        ...consultores,
        {
          id: -1,
          nome: `Consultor ${selectedConsultorKey}`,
          tenantId: "",
          tenantLabel: DEFAULT_TENANT_LABEL,
          selectionKey: selectedConsultorKey as string,
        },
      ]
    : consultores;

  const consultorSelecionado = consultoresDisponiveis.find(
    (item) => item.selectionKey === selectedConsultorKey,
  );

  const previewHtml = useMemo(
    () =>
      buildAdesaoHtml({
        titular: dados.titularDetalhes,
        endereco: dados.endereco,
        responsavel: dados.responsavelFinanceiro,
        usarMesmosDados: dados.usarMesmosDados,
        plano: dados.planoSelecionado,
        billingType: dados.billingType,
        consultorNome: consultorSelecionado?.nome,
        tenantLabel: consultorSelecionado?.tenantLabel,
        assinaturaTitularRegistrada: dados.assinaturaTitularRegistrada,
      }),
    [consultorSelecionado, dados],
  );

  return (
    <Card className="border-green-200 shadow-md">
      <CardHeader>
        <CardTitle>Confirmação de Cadastro</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-5">
          <Label
            htmlFor="consultor-select"
            className="text-sm font-semibold text-emerald-800"
          >
            Consultor Responsável <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Select
              value={selectedConsultorKey}
              onValueChange={onSelectConsultor}
              disabled={isConsultorLocked || isLoadingConsultores}
            >
              <SelectTrigger
                id="consultor-select"
                className="w-full bg-white border-emerald-200 sm:max-w-md"
              >
                <SelectValue
                  placeholder={
                    isLoadingConsultores
                      ? "Carregando consultores..."
                      : "Selecione um consultor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {consultoresDisponiveis.map((consultorItem) => (
                  <SelectItem
                    key={consultorItem.selectionKey}
                    value={consultorItem.selectionKey}
                  >
                    {consultorItem.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isConsultorLocked && (
              <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Bloqueado via link
              </span>
            )}
          </div>
          {consultorError && (
            <p className="text-xs font-medium text-red-600">{consultorError}</p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <iframe
            title="Proposta de adesão"
            srcDoc={previewHtml}
            className="h-[2550px] w-full border-0"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <User className="h-4 w-4 shrink-0" />
          <span>
            A proposta acima foi preenchida com os dados coletados no cadastro
            atual. Campos sem origem no fluxo permanecem em branco.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default Confirmacao;
