"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  onBack: () => void;
  tenantSlug?: string | null;
};

type AtendimentoTenantConfig = {
  centralNumber: string;
  sacNumber: string;
  whatsappNumber: string;
};

const TENANT_ATENDIMENTO_CONFIG: Record<string, AtendimentoTenantConfig> = {
  bosque: {
    centralNumber: "71 3034-7323",
    sacNumber: "71 3034-7323",
    whatsappNumber: "71 3034-7323",
  },
  pax: {
    centralNumber: "71 3034-7323",
    sacNumber: "71 3034-7323",
    whatsappNumber: "71 3034-7323",
  },
  lider: {
    centralNumber: "71 3034-7323",
    sacNumber: "71 3034-7323",
    whatsappNumber: "71 3034-7323",
  },
};

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function getAtendimentoConfig(
  tenantSlug?: string | null,
): AtendimentoTenantConfig {
  const tenant = (tenantSlug ?? "").trim().toLowerCase();
  return TENANT_ATENDIMENTO_CONFIG[tenant] ?? TENANT_ATENDIMENTO_CONFIG.bosque;
}

export default function AtendimentoScreen({ onBack, tenantSlug }: Props) {
  const [centralOpen, setCentralOpen] = useState(true);
  const [sacOpen, setSacOpen] = useState(false);
  const atendimentoConfig = getAtendimentoConfig(tenantSlug);
  const centralTel = normalizePhone(atendimentoConfig.centralNumber);
  const sacTel = normalizePhone(atendimentoConfig.sacNumber);
  const whatsappTel = normalizePhone(atendimentoConfig.whatsappNumber);

  return (
    <div
      id="screen-atendimento"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* App header */}
      <div className="cm-app-header">
        <div className="cm-app-header-row">
          <button
            type="button"
            className="cm-btn-back"
            onClick={onBack}
            aria-label="Voltar"
          >
            <Image
              src="/cliente-mobile/Vector-30.png"
              alt=""
              width={20}
              height={17}
              aria-hidden
            />
          </button>
          <h1>Atendimento</h1>
        </div>
      </div>

      {/* White panel */}
      <div
        className="cm-panel"
        style={{ padding: 0, borderRadius: "20px 20px 0 0", marginTop: 3 }}
      >
        <div className="cm-accordion" style={{ padding: "0 16px" }}>
          {/* Central de Relacionamento */}
          <div className={`cm-accordion-item${centralOpen ? " open" : ""}`}>
            <button
              type="button"
              className="cm-accordion-header"
              onClick={() => setCentralOpen((o) => !o)}
            >
              <div className="cm-accordion-header-text">
                <p className="cm-acc-title">Central de Relacionamento</p>
                <p className="cm-acc-sub">Consultas, informações e serviços</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cliente-mobile/Vector-33.png"
                alt=""
                className="cm-accordion-chevron"
                width={23}
                height={11}
              />
            </button>
            <div className="cm-accordion-body">
              <div className="cm-accordion-content cm-accordion-content-padded-top">
                <button
                  type="button"
                  className="cm-btn-phone-card"
                  onClick={() => window.open(`tel:${centralTel}`, "_self")}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <p className="cm-phone-label">Central de Relacionamento</p>
                    <p className="cm-phone-number">
                      {atendimentoConfig.centralNumber}
                    </p>
                  </div>
                  <span className="cm-phone-call">Ligar</span>
                </button>

                <button
                  type="button"
                  className="cm-btn-whatsapp"
                  onClick={() =>
                    window.open(`https://wa.me/55${whatsappTel}`, "_blank")
                  }
                >
                  Iniciar conversa pelo WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* SAC */}
          <div className={`cm-accordion-item${sacOpen ? " open" : ""}`}>
            <button
              type="button"
              className="cm-accordion-header"
              onClick={() => setSacOpen((o) => !o)}
            >
              <div className="cm-accordion-header-text">
                <p className="cm-acc-title">SAC</p>
                <p className="cm-acc-sub">
                  Reclamações, cancelamentos e informações
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cliente-mobile/Vector-33.png"
                alt=""
                className="cm-accordion-chevron"
                width={23}
                height={11}
              />
            </button>
            <div className="cm-accordion-body">
              <div className="cm-accordion-content">
                <button
                  type="button"
                  className="cm-btn-phone-card"
                  onClick={() => window.open(`tel:${sacTel}`, "_self")}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <p className="cm-phone-label">SAC</p>
                    <p className="cm-phone-number">
                      {atendimentoConfig.sacNumber}
                    </p>
                  </div>
                  <span className="cm-phone-call">Ligar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
