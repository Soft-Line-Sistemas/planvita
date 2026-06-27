"use client";

import Image from "next/image";
import { History, Users } from "lucide-react";
import type { ClientePlano } from "@/types/ClientePlano";
import type { ContaFinanceira } from "@/services/financeiro/contasCliente.service";
import type { TabId, ScreenId } from "../ClienteMobilePage";

type Props = {
  cliente: ClientePlano;
  contasFinanceiras: ContaFinanceira[];
  isLoadingFinanceiro: boolean;
  suspensoPorRegra: boolean;
  posSuspensaoAtingido: boolean;
  diasSuspensao: number;
  diasPosSuspensao: number;
  goTo: (screen: ScreenId) => void;
  changeTab: (tab: TabId) => void;
  onOpenFotoAjustes: () => void;
  onLogout: () => void;
  hasParcerias: boolean;
};

type HomeShortcut = {
  id: string;
  iconSrc?: string;
  iconLucide?: "dependentes" | "historico";
  label: string;
  action: () => void;
};

function formatValidade(isoDate: string) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length === 11)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return cpf;
}

export default function HomeScreen({
  cliente,
  suspensoPorRegra,
  posSuspensaoAtingido,
  diasSuspensao,
  diasPosSuspensao,
  goTo,
  changeTab,
  onOpenFotoAjustes,
  onLogout,
  hasParcerias,
}: Props) {
  const nomeTrimmed = cliente.nome.trim();
  const primeiroNome = nomeTrimmed.split(/\s+/)[0] || nomeTrimmed;
  const initial = primeiroNome.charAt(0).toUpperCase() || "?";
  const validade = cliente.plano.vigencia?.fim
    ? formatValidade(cliente.plano.vigencia.fim)
    : "—";
  const shortcuts: HomeShortcut[] = [
    {
      id: "plano",
      iconSrc: "/cliente-mobile/Vector-7.svg",
      label: "Benefícios do plano",
      action: () => goTo("entenda-seu-plano"),
    },
    {
      id: "faturas",
      iconSrc: "/cliente-mobile/Vector-2.svg",
      label: "Suas faturas",
      action: () => changeTab("faturas"),
    },
    {
      id: "dependentes",
      iconLucide: "dependentes",
      label: "Dependentes",
      action: () => goTo("dependentes"),
    },
    {
      id: "historico",
      iconLucide: "historico",
      label: "Histórico do Plano",
      action: () => goTo("historico-plano"),
    },
    ...(hasParcerias
      ? [
          {
            id: "parcerias",
            iconSrc: "/cliente-mobile/Vector-1.svg",
            label: "Parcerias e vantagens",
            action: () => goTo("parcerias" as ScreenId),
          },
        ]
      : []),
    {
      id: "assinaturas",
      iconSrc: "/cliente-mobile/Vector-5.svg",
      label: "Contrato e Assinatura",
      action: () => goTo("assinaturas"),
    },
  ];

  return (
    <div id="screen-home" className="cm-home-root">
      {/* ── Header (green gradient) ── */}
      <div className="cm-home-header">
        {posSuspensaoAtingido && (
          <div
            className="cm-alert cm-alert-danger"
            style={{ marginBottom: 10 }}
          >
            <span>
              Plano suspenso há mais de {diasPosSuspensao} dias de atraso.
              Regularize a mensalidade do seu plano de assistência funeral Campo
              do Bosque para reativação.
            </span>
          </div>
        )}
        {!posSuspensaoAtingido && suspensoPorRegra && (
          <div
            className="cm-alert cm-alert-danger"
            style={{ marginBottom: 10 }}
          >
            <span>
              Plano atingiu a regra de suspensão ({diasSuspensao} dias de
              atraso). Regularize a mensalidade do seu plano de assistência
              funeral Campo do Bosque.
            </span>
          </div>
        )}

        <div className="cm-home-header-top">
          <div className="cm-home-logo">
            <Image
              src="/cliente-mobile/Camada 1.svg"
              alt="Planvita"
              width={113}
              height={34}
              priority
            />
          </div>
          <button type="button" className="cm-btn-logout" onClick={onLogout}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cliente-mobile/Vector.svg" alt="" />
            <span>Sair</span>
          </button>
        </div>

        <p className="cm-greeting">
          Olá, <strong>{primeiroNome}</strong>
        </p>

        {/* Plan card (white, overlaps panel below) */}
        <div className="cm-plan-card">
          <div className="cm-plan-card-info">
            <div className="cm-plan-avatar-wrap">
              <div className="cm-plan-avatar">
                {cliente.fotoPerfilUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cliente.fotoPerfilUrl} alt="Foto do perfil" />
                ) : (
                  initial
                )}
              </div>
              <button
                type="button"
                className="cm-plan-avatar-edit"
                aria-label="Alterar foto de perfil"
                onClick={onOpenFotoAjustes}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cliente-mobile/Vector-22.svg" alt="" />
              </button>
            </div>
            <div className="cm-plan-details">
              <p className="cm-plan-name">{cliente.nome}</p>
              <p className="cm-plan-meta">
                Cpf: <strong>{formatCpf(cliente.cpf)}</strong>
                <br />
                Tipo de plano: <strong>{cliente.plano.nome}</strong>
                <br />
                Validade: <strong>{validade}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cm-btn-carteirinha"
            onClick={() => goTo("carteirinha")}
          >
            <span className="cm-btn-carteirinha-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cliente-mobile/Vector-3.svg" alt="" />
            </span>
            Carteirinha Digital
          </button>
        </div>
      </div>

      {/* ── White panel (menu + atendimento) ── */}
      <div className="cm-home-panel">
        <p className="cm-section-title">Selecione a opção desejada</p>

        <div className="cm-menu-grid">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              type="button"
              className="cm-menu-item"
              onClick={shortcut.action}
            >
              <span className="cm-menu-icon">
                {shortcut.iconLucide === "dependentes" ? (
                  <Users
                    size={32}
                    strokeWidth={2}
                    color="#4CAF37"
                    aria-hidden
                  />
                ) : shortcut.iconLucide === "historico" ? (
                  <History
                    size={32}
                    strokeWidth={2}
                    color="#4CAF37"
                    aria-hidden
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shortcut.iconSrc} alt="" />
                )}
              </span>
              <span className="cm-menu-label">{shortcut.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="cm-btn-atendimento-banner"
          onClick={() => changeTab("atendimento")}
        >
          <div className="cm-btn-atendimento-left">
            <span className="cm-atd-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cliente-mobile/Vector-6.svg" alt="" />
            </span>
            <span>Fale com um atendente</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cliente-mobile/Vector-50.svg"
            alt=""
            className="cm-atendimento-chevron"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
