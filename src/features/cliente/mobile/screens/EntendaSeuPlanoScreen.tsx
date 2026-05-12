"use client";

import Image from "next/image";
import type { ClientePlano } from "@/types/ClientePlano";

type Props = {
  cliente: ClientePlano;
  onBack: () => void;
};

const CONTRATO_URL = "/docs/contrato.docx";

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length === 11)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return cpf;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_BADGE: Record<
  string,
  { bg: string; border: string; color: string; label: string }
> = {
  ativo: { bg: "#DDFFDD", border: "#A4E0A4", color: "#266738", label: "Ativo" },
  suspenso: {
    bg: "#FFF3CD",
    border: "#FFD700",
    color: "#856404",
    label: "Suspenso",
  },
  inativo: {
    bg: "#FDEEEE",
    border: "#F9C0C0",
    color: "#A93333",
    label: "Inativo",
  },
};

export default function EntendaSeuPlanoScreen({ cliente, onBack }: Props) {
  const { plano } = cliente;
  const badge = STATUS_BADGE[plano.status] ?? {
    bg: "#F0F0F0",
    border: "#DDD",
    color: "#666",
    label: plano.status,
  };

  return (
    <div
      id="screen-entenda-seu-plano"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
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
          <h1>Contrato do Plano</h1>
        </div>
      </div>

      {/* Profile card (outside white panel) */}
      <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
        <div
          className="cm-card"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "18px 16px 22px",
          }}
        >
          <div
            className="cm-plan-avatar"
            style={{ width: 56, height: 56, fontSize: 22, flexShrink: 0 }}
          >
            {cliente.nome.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--cm-gray-800)",
              }}
            >
              {cliente.nome}
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12,
                color: "var(--cm-gray-600)",
              }}
            >
              CPF:{" "}
              <strong style={{ color: "var(--cm-gray-800)" }}>
                {formatCpf(cliente.cpf)}
              </strong>
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12,
                color: "var(--cm-gray-600)",
              }}
            >
              Plano:{" "}
              <strong style={{ color: "var(--cm-gray-800)" }}>
                {plano.nome}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── Scrollable panel (starts at "Detalhe do contrato") ── */}
      <div className="cm-panel" style={{ overflowY: "auto", marginTop: 0 }}>
        {/* ── Detalhe do contrato ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            color: "var(--cm-green-action)",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cliente-mobile/Vector-26.png"
            alt=""
            style={{
              width: 16,
              height: 20,
              objectFit: "contain",
              flexShrink: 0,
            }}
            aria-hidden
          />
          <span>Detalhe do contrato</span>
        </div>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 14,
            color: "var(--cm-gray-600)",
          }}
        >
          Informações completas sobre seu plano atual.
        </p>

        <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--cm-gray-600)" }}>
              Plano Contrato
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--cm-gray-800)",
              }}
            >
              {plano.nome}
            </p>
          </div>

          {plano.codigo && (
            <div>
              <p
                style={{ margin: 0, fontSize: 12, color: "var(--cm-gray-600)" }}
              >
                Código do Contrato
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--cm-gray-800)",
                }}
              >
                {plano.codigo}
              </p>
            </div>
          )}

          {plano.valorMensal > 0 && (
            <div>
              <p
                style={{ margin: 0, fontSize: 12, color: "var(--cm-gray-600)" }}
              >
                Valor Mensal
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--cm-gray-800)",
                }}
              >
                {formatCurrency(plano.valorMensal)}
              </p>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--cm-gray-600)" }}>
              Status:
            </span>
            <span
              style={{
                padding: "0 14px",
                height: 24,
                borderRadius: 40,
                border: `1px solid ${badge.border}`,
                background: badge.bg,
                display: "inline-flex",
                alignItems: "center",
                fontSize: 12,
                fontWeight: 600,
                color: badge.color,
              }}
            >
              {badge.label}
            </span>
          </div>

          {(plano.vigencia?.inicio || plano.vigencia?.fim) && (
            <div>
              <p
                style={{ margin: 0, fontSize: 12, color: "var(--cm-gray-600)" }}
              >
                Vigência
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cliente-mobile/Vector-27.png"
                  alt=""
                  style={{
                    width: 16,
                    height: 16,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                  aria-hidden
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--cm-gray-800)",
                    lineHeight: "20px",
                  }}
                >
                  {plano.vigencia.inicio
                    ? formatDate(plano.vigencia.inicio)
                    : "—"}
                  {plano.vigencia.inicio && plano.vigencia.fim ? " até " : ""}
                  {plano.vigencia.fim ? formatDate(plano.vigencia.fim) : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Coberturas ── */}
        {plano.cobertura.length > 0 && (
          <>
            <div
              style={{ height: 1, background: "#EFEFEF", margin: "4px 0 16px" }}
            />
            <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
              {plano.cobertura.map((item, i) => (
                <div
                  key={`${item}-${i}`}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/cliente-mobile/Vector-25.png"
                    alt=""
                    style={{
                      width: 16,
                      height: 16,
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  />
                  <span
                    style={{
                      fontSize: 14,
                      lineHeight: "20px",
                      color: "var(--cm-gray-800)",
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Dependentes ── */}
        {(cliente.dependentes?.length ?? 0) > 0 && (
          <>
            <div
              style={{ height: 1, background: "#EFEFEF", margin: "4px 0 16px" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                color: "var(--cm-green-action)",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cliente-mobile/Vector-29.png"
                alt=""
                style={{ width: 22, height: 22, objectFit: "contain" }}
                aria-hidden
              />
              <span>Dependentes ({cliente.dependentes!.length})</span>
            </div>
            <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
              {cliente.dependentes!.map((dep) => (
                <div
                  key={dep.id}
                  style={{
                    borderRadius: 20,
                    background: "#F4F4F4",
                    border: "1px solid #E9E9E9",
                    padding: "18px 22px",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#535353",
                    }}
                  >
                    {dep.nome}
                  </p>
                  {dep.tipo && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "var(--cm-green-primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginTop: 2,
                      }}
                    >
                      {dep.tipo}
                    </p>
                  )}
                  {dep.dataNascimento && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "var(--cm-gray-400)",
                        marginTop: 2,
                      }}
                    >
                      Nasc.: {formatDate(dep.dataNascimento)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Histórico ── */}
        {plano.vigencia?.inicio && (
          <>
            <div
              style={{ height: 1, background: "#EFEFEF", margin: "4px 0 16px" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                color: "var(--cm-green-action)",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cliente-mobile/Vector-28.png"
                alt=""
                style={{ width: 16, height: 16, objectFit: "contain" }}
                aria-hidden
              />
              <span>Histórico do Plano</span>
            </div>
            <div
              style={{
                position: "relative",
                paddingLeft: 20,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 5,
                  top: 10,
                  bottom: 10,
                  width: 1,
                  background: "#D3D3D3",
                }}
              />
              <div style={{ position: "relative", marginBottom: 16 }}>
                <span
                  style={{
                    position: "absolute",
                    left: -19,
                    top: 5,
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "var(--cm-green-primary)",
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#535353",
                  }}
                >
                  Situação Atual
                </p>
                <p
                  style={{ margin: "2px 0 0", fontSize: 13, color: "#535353" }}
                >
                  {badge.label}
                </p>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: -19,
                    top: 5,
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "#D3D3D3",
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#535353",
                  }}
                >
                  Contratação
                </p>
                <p
                  style={{ margin: "2px 0 0", fontSize: 13, color: "#535353" }}
                >
                  {formatDate(plano.vigencia.inicio)}
                </p>
                <p
                  style={{ margin: "2px 0 0", fontSize: 13, color: "#535353" }}
                >
                  Início da vigência do plano {plano.nome}.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── Download button ── */}
        <button
          type="button"
          className="cm-btn-solid"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
          }}
          onClick={() =>
            window.open(CONTRATO_URL, "_blank", "noopener,noreferrer")
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cliente-mobile/Vector-24.png"
            alt=""
            style={{ width: 13, height: 16 }}
            aria-hidden
          />
          <span>Download do contrato</span>
        </button>
      </div>
    </div>
  );
}
