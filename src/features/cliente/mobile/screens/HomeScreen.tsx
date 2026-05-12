"use client";

import Image from "next/image";
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
  onLogout: () => void;
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
  onLogout,
}: Props) {
  const primeiroNome = cliente.nome.split(" ")[0] ?? cliente.nome;
  const initial = primeiroNome.charAt(0).toUpperCase();
  const validade = cliente.plano.vigencia?.fim
    ? formatValidade(cliente.plano.vigencia.fim)
    : "—";

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
              Regularize o pagamento para reativação.
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
              atraso). Regularize o pagamento.
            </span>
          </div>
        )}

        <div className="cm-home-header-top">
          <div className="cm-home-logo">
            <Image
              src="/cliente-mobile/Camada 1.png"
              alt="Planvita"
              width={113}
              height={34}
              priority
            />
          </div>
          <button type="button" className="cm-btn-logout" onClick={onLogout}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cliente-mobile/Vector.png" alt="" />
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
              <div className="cm-plan-avatar">{initial}</div>
              <span className="cm-plan-avatar-edit" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cliente-mobile/Vector-22.png" alt="" />
              </span>
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
              <img src="/cliente-mobile/Vector-3.png" alt="" />
            </span>
            Carteirinha Digital
          </button>
        </div>
      </div>

      {/* ── White panel (menu + atendimento) ── */}
      <div className="cm-home-panel">
        <p className="cm-section-title">Selecione a opção desejada</p>

        <div className="cm-menu-grid">
          <button
            type="button"
            className="cm-menu-item"
            onClick={() => goTo("entenda-seu-plano")}
          >
            <span className="cm-menu-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cliente-mobile/Vector-7.png" alt="" />
            </span>
            <span className="cm-menu-label">
              Contrato
              <br />
              seu plano
            </span>
          </button>

          <button
            type="button"
            className="cm-menu-item"
            onClick={() => changeTab("faturas")}
          >
            <span className="cm-menu-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cliente-mobile/Vector-2.png" alt="" />
            </span>
            <span className="cm-menu-label">
              Acesse
              <br />
              suas faturas
            </span>
          </button>

          <button
            type="button"
            className="cm-menu-item"
            onClick={() => goTo("parcerias")}
          >
            <span className="cm-menu-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cliente-mobile/Vector-1.png" alt="" />
            </span>
            <span className="cm-menu-label">
              Parcerias e
              <br />
              vantagens
            </span>
          </button>

          <button
            type="button"
            className="cm-menu-item"
            onClick={() => goTo("assinaturas")}
          >
            <span className="cm-menu-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cliente-mobile/Vector-5.png" alt="" />
            </span>
            <span className="cm-menu-label">Assinaturas</span>
          </button>
        </div>

        <button
          type="button"
          className="cm-btn-atendimento-banner"
          onClick={() => changeTab("atendimento")}
        >
          <div className="cm-btn-atendimento-left">
            <span className="cm-atd-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cliente-mobile/Vector-6.png" alt="" />
            </span>
            <span>Fale com um atendente</span>
          </div>
          <span className="cm-atendimento-chevron">›</span>
        </button>

        {(cliente.dependentes?.length ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => goTo("dependentes")}
            className="cm-home-dependentes-link"
          >
            {cliente.dependentes!.length}{" "}
            {cliente.dependentes!.length === 1 ? "dependente" : "dependentes"}{" "}
            vinculado
            {cliente.dependentes!.length !== 1 ? "s" : ""} ao plano →
          </button>
        )}
      </div>
    </div>
  );
}
