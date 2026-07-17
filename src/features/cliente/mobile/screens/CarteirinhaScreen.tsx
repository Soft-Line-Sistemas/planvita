"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { ClientePlano } from "@/types/ClientePlano";

type Props = {
  cliente: ClientePlano;
  onBack: () => void;
};

function formatDateLong(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCpfMasked(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length === 11)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return cpf;
}

function getLeftLogoByTenant(tenantSlug?: string | null): string | null {
  const tenant = (tenantSlug ?? "").trim().toLowerCase();
  if (tenant === "lider") return "/cliente-mobile/lider.avif";
  if (tenant === "bosque") return null;
  return "/cliente-mobile/image 6.png";
}

export default function CarteirinhaScreen({ cliente, onBack }: Props) {
  const [beneficiosModalOpen, setBeneficiosModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const vigenciaFim = cliente.plano.vigencia?.fim
    ? formatDateLong(cliente.plano.vigencia.fim)
    : "—";
  const carteirinhaId =
    cliente.numeroCarteirinha || cliente.plano.codigo || "—";
  const tenantSlug = (cliente.tenantSlug ?? "").trim().toLowerCase();
  const leftLogoSrc = getLeftLogoByTenant(tenantSlug);
  const isLiderTenant = tenantSlug === "lider";
  const cardFileName = `carteirinha-${(carteirinhaId || "cliente")
    .toString()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")}.pdf`;

  useEffect(() => {
    if (!beneficiosModalOpen || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [beneficiosModalOpen]);

  const handleDownloadCardPdf = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const [htmlToImageModule, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const toPngFn =
        htmlToImageModule.toPng ?? htmlToImageModule.default?.toPng;
      if (typeof toPngFn !== "function") {
        throw new Error("Função toPng não disponível no html-to-image.");
      }

      const pixelRatio = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
      const dataUrl = await toPngFn(cardRef.current, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: "#ffffff",
        skipFonts: true,
        fontEmbedCSS: "",
        style: {
          boxShadow: "none",
        },
      });
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
        throw new Error("Imagem da carteirinha inválida para gerar PDF.");
      }

      const CARD_MM_W = 53.98;
      const CARD_MM_H = 85.6;

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const marginTop = 10;
      const marginLeft = 10;
      const x = Math.min(marginLeft, Math.max(0, pageW - CARD_MM_W));
      const y = marginTop;

      pdf.addImage(
        dataUrl,
        "PNG",
        x,
        y,
        CARD_MM_W,
        CARD_MM_H,
        undefined,
        "FAST",
      );
      pdf.save(cardFileName);
    } catch (error) {
      console.error("Erro ao gerar PDF da carteirinha:", error);
      window.alert("Não foi possível gerar o PDF da carteirinha.");
    }
  }, [cardFileName]);

  return (
    <div
      id="screen-carteirinha"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
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
          <h1>Carteirinha Digital</h1>
        </div>
      </div>

      <div className="cm-panel cm-carteirinha-panel">
        <div className="cm-carteirinha-vertical-wrap">
          <div className="cm-carteirinha-vertical-card" ref={cardRef}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cliente-mobile/icon-8-1-2x.png"
              alt=""
              width={612}
              height={662}
              className="cm-carteirinha-ornament"
              aria-hidden
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cliente-mobile/Camada 3.png"
              alt=""
              width={113}
              height={34}
              className="cm-carteirinha-bottom-right-logo"
            />
            <div className="cm-carteirinha-rotated-content">
              <div className="cm-carteirinha-vertical-top">
                <p className="cm-carteirinha-vertical-id">{carteirinhaId}</p>
                <p className="cm-carteirinha-vertical-name">{cliente.nome}</p>
                <p className="cm-carteirinha-vertical-meta">
                  CPF: {formatCpfMasked(cliente.cpf)}
                </p>
                <div
                  aria-hidden
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    borderTop: "0.75px solid #71D531",
                    margin: "8px 0",
                  }}
                />
                <p className="cm-carteirinha-vertical-meta">
                  Vigência {vigenciaFim}
                </p>
              </div>
              <div className="cm-carteirinha-vertical-bottom">
                <div className="cm-carteirinha-vertical-plan-badge">
                  Plano:{" "}
                  <strong style={{ marginLeft: 4 }}>
                    {cliente.plano.nome}
                  </strong>
                </div>
              </div>
              <span className="cm-carteirinha-vertical-note">
                Agora você faz parte da rede Campo do Bosque
              </span>
            </div>
            {leftLogoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={leftLogoSrc}
                alt=""
                width={28}
                height={92}
                className="cm-carteirinha-bottom-left-logo"
                style={
                  isLiderTenant
                    ? {
                        width: 150,
                        left: -40,
                        bottom: 60,
                        transform: "rotate(90deg)",
                        transformOrigin: "center",
                      }
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>

        <div className="cm-card-actions">
          <button
            type="button"
            className="cm-btn-outline"
            onClick={() => setBeneficiosModalOpen(true)}
          >
            Ver benefícios
          </button>
          <button
            type="button"
            className="cm-btn-solid"
            onClick={handleDownloadCardPdf}
          >
            Baixar em PDF
          </button>
        </div>

        {beneficiosModalOpen && typeof document !== "undefined"
          ? createPortal(
              <div
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
                onClick={() => setBeneficiosModalOpen(false)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="beneficios-modal-title"
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
                    aria-label="Fechar"
                    onClick={() => setBeneficiosModalOpen(false)}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      position: "absolute",
                      top: 14,
                      right: 14,
                      lineHeight: 0,
                      cursor: "pointer",
                    }}
                  >
                    <Image
                      src="/cliente-mobile/Vector-39.svg"
                      alt=""
                      width={31}
                      height={31}
                      aria-hidden
                    />
                  </button>

                  <div style={{ marginBottom: 14 }}>
                    <h3
                      id="beneficios-modal-title"
                      style={{
                        margin: 0,
                        color: "#535353",
                        fontSize: 22,
                        fontWeight: 700,
                        lineHeight: "28px",
                      }}
                    >
                      Coberturas e Benefícios
                    </h3>
                  </div>

                  {cliente.plano.cobertura.length > 0 ? (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {cliente.plano.cobertura.map((item, i) => (
                        <li
                          key={`${item}-${i}`}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            fontSize: 14,
                            color: "var(--cm-gray-800)",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/cliente-mobile/Vector-34.svg"
                            alt=""
                            style={{
                              width: 13,
                              height: 13,
                              marginTop: 2,
                              flexShrink: 0,
                            }}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: "var(--cm-gray-600)",
                      }}
                    >
                      Nenhum benefício cadastrado para este plano.
                    </p>
                  )}
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
}
