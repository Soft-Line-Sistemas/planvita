"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  listarCategoriasCliente,
  listarVantagensCliente,
  obterVantagemCliente,
  registrarResgate,
} from "@/services/parcerias.service";

import type { ParceriaVantagemResumo } from "@/types/Parcerias";

type Props = {
  onBack: () => void;
  onGoAtendimento: () => void;
};

export default function ParceriasScreen({ onBack, onGoAtendimento }: Props) {
  const [q, setQ] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | undefined>();
  const [slugSelecionado, setSlugSelecionado] = useState<string | null>(null);

  const { data: categorias = [] } = useQuery({
    queryKey: ["parcerias", "categorias-cliente"],
    queryFn: listarCategoriasCliente,
  });

  const {
    data: vantagens = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["parcerias", "vantagens-cliente", q, categoriaId],
    queryFn: () => listarVantagensCliente({ q, categoriaId }),
  });
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    setShowSkeleton(true);
    const timer = window.setTimeout(() => setShowSkeleton(false), 450);
    return () => window.clearTimeout(timer);
  }, [q, categoriaId]);

  useEffect(() => {
    if (!slugSelecionado || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [slugSelecionado]);

  const { data: detalhe, isLoading: loadingDetalhe } = useQuery({
    queryKey: ["parcerias", "detalhe", slugSelecionado],
    queryFn: () => obterVantagemCliente(String(slugSelecionado)),
    enabled: Boolean(slugSelecionado),
  });

  const listagem = useMemo(() => vantagens, [vantagens]);

  const onAcao = async (
    vantagem: ParceriaVantagemResumo,
    canal: "CUPOM" | "LINK" | "WHATSAPP",
    url?: string | null,
  ) => {
    if (!vantagem.elegivel) return;
    try {
      await registrarResgate(vantagem.id, canal);
    } catch {
      // Mantém ação de UX mesmo com falha de log.
    }

    if (canal === "CUPOM" && detalhe?.codigoCupom) {
      await navigator.clipboard.writeText(detalhe.codigoCupom);
    }
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div id="screen-parcerias" className="cm-home-root">
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
          <h1>Parcerias e Vantagens</h1>
        </div>
      </div>

      <div
        className="cm-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <input
            className="cm-cad-input"
            placeholder="Buscar parceiro ou vantagem"
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="cm-cad-plan-chip"
            onClick={() => setCategoriaId(undefined)}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              className="cm-cad-plan-chip"
              onClick={() => setCategoriaId(c.id)}
              style={
                categoriaId === c.id
                  ? { background: "#3a9b28", color: "#fff" }
                  : undefined
              }
            >
              {c.nome}
            </button>
          ))}
        </div>

        <p
          className="cm-section-title"
          style={{ marginBottom: 4, flexShrink: 0 }}
        >
          Vantagens disponíveis
        </p>
        {(isLoading || showSkeleton) && (
          <div className="cm-cad-plan-loading">
            <Loader2 size={24} className="cm-spinner" aria-hidden />
            <p>Carregando vantagens...</p>
          </div>
        )}
        {isError && (
          <p className="cm-cad-error">Falha ao carregar vantagens.</p>
        )}
        {!isLoading && !showSkeleton && !isError && listagem.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Image
              src="/cliente-mobile/Vector-1.svg"
              alt=""
              width={64}
              height={64}
              style={{ opacity: 0.2, marginBottom: 24 }}
              aria-hidden
            />
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: "var(--cm-gray-800)",
                letterSpacing: "-0.5px",
              }}
            >
              Em breve!
            </h2>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 14,
                lineHeight: "22px",
                color: "var(--cm-gray-600)",
                maxWidth: 300,
              }}
            >
              Estamos preparando parcerias e vantagens exclusivas para os
              membros do plano. Em breve você poderá acessar descontos e
              benefícios incríveis aqui.
            </p>
            <div
              style={{
                marginTop: 32,
                padding: "10px 24px",
                borderRadius: 40,
                background: "var(--cm-green-lightest)",
                border: "1px solid var(--cm-green-light)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--cm-green-primary)",
              }}
            >
              Descontos de até 40% em parceiros
            </div>
          </div>
        )}

        <div
          style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingBottom: 8 }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            {listagem.map((item) => (
              <CardVantagem
                key={item.id}
                item={item}
                onOpen={() => setSlugSelecionado(item.slug)}
              />
            ))}
          </div>
        </div>

        {slugSelecionado && typeof document !== "undefined"
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
                onClick={() => setSlugSelecionado(null)}
              >
                <div
                  className="cm-cad-plan-modal-card"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="parceria-modal-title"
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
                    onClick={() => setSlugSelecionado(null)}
                  >
                    <Image
                      src="/cliente-mobile/Vector-39.svg"
                      alt=""
                      width={31}
                      height={31}
                      aria-hidden
                    />
                  </button>

                  <h3
                    id="parceria-modal-title"
                    className="cm-cad-plan-modal-title"
                  >
                    {detalhe?.titulo ?? "Carregando..."}
                  </h3>

                  {loadingDetalhe ? (
                    <p className="cm-cad-conf-muted">Carregando detalhe...</p>
                  ) : (
                    <>
                      <p
                        className="cm-cad-service-desc"
                        style={{ marginTop: 8 }}
                      >
                        {detalhe?.descricaoCompleta ||
                          detalhe?.descricaoCurta ||
                          ""}
                      </p>
                      {detalhe?.regrasUso && (
                        <p className="cm-cad-conf-muted">
                          Regras: {detalhe.regrasUso}
                        </p>
                      )}
                      <p
                        className="cm-cad-conf-muted"
                        style={{ marginTop: 8, marginBottom: 4 }}
                      >
                        Dúvidas sobre esta vantagem? Fale com nosso atendimento.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSlugSelecionado(null);
                          onGoAtendimento();
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          textDecoration: "underline",
                          color: "var(--cm-green-primary)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Saiba mais...
                      </button>
                      {!detalhe?.elegivel && detalhe?.motivoBloqueio && (
                        <p className="cm-cad-error">{detalhe.motivoBloqueio}</p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 8,
                        }}
                      >
                        {detalhe?.codigoCupom && (
                          <button
                            type="button"
                            className="cm-cad-service-badge"
                            onClick={() => onAcao(detalhe, "CUPOM")}
                            disabled={!detalhe.elegivel}
                          >
                            Copiar cupom
                          </button>
                        )}
                        {detalhe?.linkResgate && (
                          <button
                            type="button"
                            className="cm-cad-service-badge"
                            onClick={() =>
                              onAcao(detalhe, "LINK", detalhe.linkResgate)
                            }
                            disabled={!detalhe.elegivel}
                          >
                            Abrir link
                          </button>
                        )}
                        {detalhe?.whatsapp && (
                          <button
                            type="button"
                            className="cm-cad-service-badge"
                            onClick={() =>
                              onAcao(
                                detalhe,
                                "WHATSAPP",
                                `https://wa.me/${detalhe.whatsapp?.replace(/\D/g, "")}`,
                              )
                            }
                            disabled={!detalhe.elegivel}
                          >
                            WhatsApp
                          </button>
                        )}
                      </div>
                    </>
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

function CardVantagem({
  item,
  onOpen,
}: {
  item: ParceriaVantagemResumo;
  onOpen: () => void;
}) {
  const iconSrc = getParceriaIcon(item);
  const iconSize = iconSrc.includes("Vector-14") ? 30 : 26;

  return (
    <button
      type="button"
      className="cm-cad-service-card"
      onClick={onOpen}
      style={{ textAlign: "left" }}
    >
      <div className="cm-cad-service-card-top">
        <div className="cm-cad-service-icon" aria-hidden>
          <Image src={iconSrc} alt="" width={iconSize} height={iconSize} />
        </div>
        <div className="cm-cad-service-main">
          <p className="cm-cad-service-title">{item.titulo}</p>
          <p className="cm-cad-service-desc">
            {item.descricaoCurta || item.parceiro.nome}
          </p>
          <p className="cm-cad-conf-muted" style={{ marginTop: 4 }}>
            {item.parceiro.nome}{" "}
            {item.parceiro.cidade
              ? `• ${item.parceiro.cidade}/${item.parceiro.uf ?? ""}`
              : ""}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <span
          className="cm-cad-service-badge"
          style={{ fontSize: 11, padding: "6px 10px", lineHeight: 1 }}
        >
          {item.tipo}
        </span>
        <span className={item.elegivel ? "cm-cad-conf-muted" : "cm-cad-error"}>
          {item.elegivel ? "Disponível" : item.motivoBloqueio || "Indisponível"}
        </span>
      </div>
    </button>
  );
}

function getParceriaIcon(item: ParceriaVantagemResumo): string {
  const slug = (item.slug ?? "").toLowerCase();
  const titulo = (item.titulo ?? "").toLowerCase();

  if (slug.includes("telemedicina") || titulo.includes("telemedicina")) {
    return "/cliente-mobile/Vector-14.svg";
  }
  if (
    slug.includes("clube-de-beneficios") ||
    titulo.includes("clube de benefícios")
  ) {
    return "/cliente-mobile/Vector-16.svg";
  }
  return "/cliente-mobile/Vector-1.svg";
}
