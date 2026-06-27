"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ClientePlano } from "@/types/ClientePlano";

type Props = {
  cliente: ClientePlano;
  onBack: () => void;
  initialSection?: "detalhes" | "historico";
  headerTitle?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
const ASSINATURA_API_BASE = API_BASE_URL
  ? `${API_BASE_URL}/${API_VERSION}`
  : undefined;
const CONTRATO_URL = ASSINATURA_API_BASE
  ? `${ASSINATURA_API_BASE}/titular/me/contrato/arquivo?format=pdf`
  : "/docs/contrato.docx";

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

type HistoricoPlanoItem = {
  id: string;
  titulo: string;
  data: string;
  descricao: string;
  destaque?: boolean;
  sortDate: string;
};

const STATUS_BADGE: Record<
  string,
  { bg: string; border: string; color: string; label: string }
> = {
  ativo: { bg: "#DDFFDD", border: "#A4E0A4", color: "#266738", label: "Ativo" },
  pendente_assinatura: {
    bg: "#FFF7E0",
    border: "#F5D77A",
    color: "#8A6A00",
    label: "Pendente de assinatura",
  },
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

export default function EntendaSeuPlanoScreen({
  cliente,
  onBack,
  initialSection = "detalhes",
  headerTitle = "Contrato do Plano",
}: Props) {
  const [baixandoContrato, setBaixandoContrato] = useState(false);
  const { plano } = cliente;
  const historicoRef = useRef<HTMLDivElement | null>(null);
  const showingHistoricoOnly = initialSection === "historico";
  const nomeTrimmed = cliente.nome.trim();
  const primeiroNome = nomeTrimmed.split(/\s+/)[0] || nomeTrimmed;
  const initial = primeiroNome.charAt(0).toUpperCase() || "?";
  const badge = STATUS_BADGE[plano.status] ?? {
    bg: "#F0F0F0",
    border: "#DDD",
    color: "#666",
    label: plano.status,
  };
  const dataInicioVigencia = new Date(plano.vigencia.inicio);
  const dataValidaInicio = !isNaN(dataInicioVigencia.getTime());
  const dataContratacao = dataValidaInicio
    ? new Date(dataInicioVigencia.getTime() - 24 * 60 * 60 * 1000)
    : null;
  const temClubeBeneficios = plano.cobertura.some((item) =>
    item.toLowerCase().includes("benef"),
  );
  const historicoPlano: HistoricoPlanoItem[] = [
    {
      id: "status-atual",
      titulo: "Status do plano",
      data: formatDate(new Date().toISOString()),
      descricao: `Plano ${badge.label.toLowerCase()}, contrato vigente e acompanhamento cadastral disponível pelo aplicativo.`,
      destaque: true,
      sortDate: new Date().toISOString(),
    },
    ...(temClubeBeneficios
      ? [
          {
            id: "beneficios",
            titulo: "Benefícios complementares habilitados",
            data: dataValidaInicio
              ? formatDate(
                  new Date(
                    dataInicioVigencia.getTime() + 15 * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                )
              : formatDate(new Date().toISOString()),
            descricao:
              "Rede de parceiros e benefícios do plano disponibilizada conforme a cobertura contratada.",
            sortDate: dataValidaInicio
              ? new Date(
                  dataInicioVigencia.getTime() + 15 * 24 * 60 * 60 * 1000,
                ).toISOString()
              : new Date().toISOString(),
          },
        ]
      : []),
    ...(dataValidaInicio
      ? [
          {
            id: "implantacao",
            titulo: "Implantação da vigência",
            data: formatDate(plano.vigencia.inicio),
            descricao: `Ativação do plano ${plano.nome} com início da cobertura prevista em contrato.`,
            sortDate: plano.vigencia.inicio,
          },
        ]
      : []),
    ...(dataContratacao
      ? [
          {
            id: "contratacao",
            titulo: "Contratação",
            data: formatDate(dataContratacao.toISOString()),
            descricao:
              "Proposta formalizada e contrato emitido para adesão do titular ao plano.",
            sortDate: dataContratacao.toISOString(),
          },
        ]
      : []),
  ].sort(
    (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime(),
  );

  useEffect(() => {
    if (initialSection !== "historico") return;
    const target = historicoRef.current;
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [initialSection]);

  const handleDownloadContrato = async () => {
    setBaixandoContrato(true);
    try {
      const response = await fetch(CONTRATO_URL, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Não foi possível gerar o contrato em PDF.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "contrato-assinado.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Falha ao baixar contrato.",
      );
    } finally {
      setBaixandoContrato(false);
    }
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
              src="/cliente-mobile/Vector-30.svg"
              alt=""
              width={20}
              height={17}
              aria-hidden
            />
          </button>
          <h1>{headerTitle}</h1>
        </div>
      </div>

      {/* Profile card (outside white panel) */}
      <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
        <div
          className="cm-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 16px 22px",
          }}
        >
          <div
            className="cm-plan-avatar"
            style={{ width: 56, height: 56, fontSize: 22, flexShrink: 0 }}
          >
            {cliente.fotoPerfilUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cliente.fotoPerfilUrl} alt="Foto do perfil" />
            ) : (
              initial
            )}
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

      {/* ── Scrollable panel ── */}
      <div className="cm-panel" style={{ overflowY: "auto", marginTop: 0 }}>
        {!showingHistoricoOnly && (
          <>
            <div>
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
                  src="/cliente-mobile/Vector-26.svg"
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
            </div>

            <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "var(--cm-gray-600)",
                  }}
                >
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
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--cm-gray-600)",
                    }}
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

              <div
                style={{ display: plano.valorMensal > 0 ? "block" : "none" }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "var(--cm-gray-600)",
                  }}
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
                  {plano.valorMensal > 0
                    ? formatCurrency(plano.valorMensal)
                    : ""}
                </p>
              </div>

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
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--cm-gray-600)",
                    }}
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
                      src="/cliente-mobile/Vector-27.svg"
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
                      {plano.vigencia.inicio && plano.vigencia.fim
                        ? " até "
                        : ""}
                      {plano.vigencia.fim ? formatDate(plano.vigencia.fim) : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {plano.cobertura.length > 0 && (
              <>
                <div
                  style={{
                    height: 1,
                    background: "#EFEFEF",
                    margin: "4px 0 16px",
                  }}
                />
                <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                  {plano.cobertura.map((item, i) => (
                    <div
                      key={`${item}-${i}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/cliente-mobile/Vector-25.svg"
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
          </>
        )}

        {/* ── Histórico ── */}
        {showingHistoricoOnly && historicoPlano.length > 0 && (
          <>
            <div
              ref={historicoRef}
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
                src="/cliente-mobile/Vector-28.svg"
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
              {historicoPlano.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    position: "relative",
                    marginBottom: index === historicoPlano.length - 1 ? 0 : 16,
                    zIndex: 1,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: -19,
                      top: 5,
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      background:
                        index === 0 ? "var(--cm-green-primary)" : "#D3D3D3",
                    }}
                  />
                  {index < historicoPlano.length - 1 && (
                    <span
                      style={{
                        position: "absolute",
                        left: -14,
                        top: 16,
                        width: 2,
                        height: "calc(100% + 16px)",
                        background:
                          index === 0 ? "var(--cm-green-primary)" : "#D3D3D3",
                      }}
                    />
                  )}
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#535353",
                    }}
                  >
                    {item.titulo}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 13,
                      color: "#535353",
                    }}
                  >
                    {item.data}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 13,
                      color: "#535353",
                    }}
                  >
                    {item.descricao}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {!showingHistoricoOnly && (
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
            onClick={() => handleDownloadContrato()}
            disabled={baixandoContrato}
          >
            {baixandoContrato ? (
              <Loader2 size={16} className="cm-spinner" aria-hidden />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/cliente-mobile/Vector-24.svg"
                alt=""
                style={{ width: 13, height: 16 }}
                aria-hidden
              />
            )}
            <span>
              {baixandoContrato ? "Gerando PDF..." : "Download do contrato"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
