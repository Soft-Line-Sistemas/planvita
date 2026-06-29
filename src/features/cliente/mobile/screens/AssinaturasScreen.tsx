"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, RotateCw, X, Save } from "lucide-react";
import Image from "next/image";
import {
  listarAssinaturas,
  salvarAssinatura,
  type AssinaturaDigital,
} from "@/services/assinaturas-cliente.service";
import SignaturePad, {
  type SignaturePadHandle,
} from "@/components/SignaturePad";

const TIPOS_ASSINATURA = [
  { id: "TITULAR_ASSINATURA_1", label: "Titular - Assinatura 1" },
  { id: "TITULAR_ASSINATURA_2", label: "Titular - Assinatura 2" },
  { id: "CORRESPONSAVEL_ASSINATURA_1", label: "Corresponsável financeiro - 1" },
  { id: "CORRESPONSAVEL_ASSINATURA_2", label: "Corresponsável financeiro - 2" },
] as const;

const TIPOS_ASSINATURA_IDS = new Set<string>(
  TIPOS_ASSINATURA.map((item) => item.id),
);
const ASSINATURA_TIPO_ALIASES: Record<string, string> = {
  TITULARASSINATURA1: "TITULAR_ASSINATURA_1",
  TITULARASSINATURA2: "TITULAR_ASSINATURA_2",
  CORRESPONSAVELASSINATURA1: "CORRESPONSAVEL_ASSINATURA_1",
  CORRESPONSAVELASSINATURA2: "CORRESPONSAVEL_ASSINATURA_2",
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
const ASSINATURA_API_BASE = API_BASE_URL
  ? `${API_BASE_URL}/${API_VERSION}`
  : undefined;
const CONTRATO_DOWNLOAD_URL = ASSINATURA_API_BASE
  ? `${ASSINATURA_API_BASE}/titular/me/contrato/arquivo?format=pdf`
  : "/docs/contrato.docx";

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function canonicalAssinaturaTipo(tipo: string) {
  const normalized = tipo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (TIPOS_ASSINATURA_IDS.has(normalized)) return normalized;

  const compact = normalized.replace(/_/g, "");
  return ASSINATURA_TIPO_ALIASES[compact] ?? normalized;
}

function buildAssinaturaUrl(
  assinaturaId: number | undefined,
  mode: "inline" | "attachment" = "inline",
) {
  if (!ASSINATURA_API_BASE || !assinaturaId) return undefined;
  const base = `${ASSINATURA_API_BASE}/titular/me/assinaturas/${assinaturaId}/arquivo`;
  const params = new URLSearchParams();
  if (mode === "inline") params.set("mode", "inline");
  return params.toString() ? `${base}?${params}` : base;
}

/* === Fullscreen landscape overlay for signing === */
function SignatureFullscreenOverlay({
  tipoId,
  onSalvar,
  salvando,
  onClose,
}: {
  tipoId: string;
  onSalvar: (tipo: string, base64: string) => Promise<void>;
  salvando: boolean;
  onClose: () => void;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    function measure() {
      // Overlay ocupa a tela inteira; canvas fica na área abaixo da toolbar
      setDims({ w: window.innerHeight, h: window.innerWidth - 56 });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const handleConfirm = async () => {
    if (!padRef.current?.hasDrawing()) {
      alert("Por favor, assine antes de salvar.");
      return;
    }
    const dataUrl = padRef.current.getDataURL();
    if (dataUrl) await onSalvar(tipoId, dataUrl);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#fff",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
        /* Gira a tela inteira 90° no sentido horário → landscape forçado */
        transform: "rotate(90deg)",
        transformOrigin: "center center",
        width: "100dvh",
        height: "100dvw",
        top: "50%",
        left: "50%",
        marginTop: "calc(-50dvw)",
        marginLeft: "calc(-50dvh)",
      }}
    >
      {/* Toolbar lateral (fica no topo após a rotação) */}
      <div
        style={{
          width: 56,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 0",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={salvando}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            borderRadius: 8,
            color: "#6b7280",
          }}
          aria-label="Fechar"
        >
          <X size={22} />
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={salvando}
          style={{
            background: "var(--cm-green-primary, #16a34a)",
            border: "none",
            cursor: "pointer",
            padding: 10,
            borderRadius: 10,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
          }}
          aria-label="Salvar assinatura"
        >
          {salvando ? (
            <Loader2 size={20} className="cm-spinner" />
          ) : (
            <Save size={20} />
          )}
        </button>
      </div>

      {/* Área do canvas ocupa o restante */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {dims.w > 0 && (
          <SignaturePad
            ref={padRef}
            width={dims.w}
            height={dims.h}
            className="touch-none cursor-crosshair"
          />
        )}
        <p
          style={{
            position: "absolute",
            bottom: 8,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 12,
            color: "#9ca3af",
            pointerEvents: "none",
          }}
        >
          Assine usando o dedo ou caneta
        </p>
      </div>
    </div>
  );
}

/* === Signature capture (active card inline) === */
function SignatureCapture({
  tipoId,
  onSalvar,
  salvando,
  onCancel,
}: {
  tipoId: string;
  onSalvar: (tipo: string, base64: string) => Promise<void>;
  salvando: boolean;
  onCancel: () => void;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const handleConfirm = async () => {
    if (!padRef.current?.hasDrawing()) {
      alert("Por favor, assine antes de salvar.");
      return;
    }
    const dataUrl = padRef.current.getDataURL();
    if (dataUrl) await onSalvar(tipoId, dataUrl);
  };

  return (
    <>
      {fullscreen && (
        <SignatureFullscreenOverlay
          tipoId={tipoId}
          salvando={salvando}
          onSalvar={async (id, b64) => {
            await onSalvar(id, b64);
            setFullscreen(false);
          }}
          onClose={() => setFullscreen(false)}
        />
      )}
      <p className="cm-assinatura-subtitle">
        Assine no quadro abaixo usando o dedo ou caneta.
      </p>
      <div className="cm-sig-pad-wrap">
        <SignaturePad
          ref={padRef}
          width={340}
          height={160}
          className="touch-none bg-white cursor-crosshair w-full"
        />
      </div>
      <div className="cm-sig-actions-row">
        <button
          type="button"
          className="cm-btn-outline"
          onClick={onCancel}
          disabled={salvando}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="cm-btn-outline"
          onClick={() => setFullscreen(true)}
          disabled={salvando}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RotateCw size={15} />
          Girar
        </button>
        <button
          type="button"
          className="cm-btn-solid"
          onClick={handleConfirm}
          disabled={salvando}
        >
          {salvando ? (
            <>
              <Loader2 size={16} className="cm-spinner" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </button>
      </div>
    </>
  );
}

/* === Signature card (done / pending / active) === */
function SignatureCard({
  tipoId,
  titulo,
  index,
  proximaEtapa,
  assinatura,
  onSalvar,
  salvando,
}: {
  tipoId: string;
  titulo: string;
  index: number;
  proximaEtapa: number;
  assinatura?: AssinaturaDigital;
  onSalvar: (tipo: string, base64: string) => Promise<void>;
  salvando: boolean;
}) {
  const [capturando, setCapturando] = useState(false);

  const estado: "done" | "active" | "locked" = assinatura
    ? "done"
    : index === proximaEtapa
      ? "active"
      : "locked";

  const previewUrl = buildAssinaturaUrl(assinatura?.id, "inline");
  const downloadUrl = buildAssinaturaUrl(assinatura?.id, "attachment");

  if (estado === "done" && assinatura) {
    return (
      <div className="cm-assinatura-card">
        <p className="cm-assinatura-title">{titulo}</p>
        <p className="cm-assinatura-subtitle">
          Assinado em {formatDate(assinatura.createdAt)}
        </p>
        {previewUrl && (
          <div className="cm-sig-preview">
            <Image
              src={previewUrl}
              alt="Assinatura"
              width={200}
              height={60}
              unoptimized
            />
          </div>
        )}
        <div className="cm-assinatura-status-row centered">
          <CheckCircle
            size={13}
            className="cm-assinatura-status-icon"
            color="var(--cm-green-primary)"
          />
          <span style={{ color: "var(--cm-green-primary)" }}>
            Assinatura concluída
          </span>
        </div>
        {downloadUrl && (
          <button
            type="button"
            className="cm-btn-outline"
            onClick={() => window.open(downloadUrl, "_blank")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cliente-mobile/Vector-20.svg"
              alt=""
              style={{ width: 15, height: 15 }}
            />
            <span>Baixar arquivo</span>
          </button>
        )}
      </div>
    );
  }

  if (estado === "active") {
    if (capturando) {
      return (
        <div className="cm-assinatura-card cm-assinatura-card-active">
          <p className="cm-assinatura-title">{titulo}</p>
          <SignatureCapture
            tipoId={tipoId}
            salvando={salvando}
            onSalvar={async (id, b64) => {
              await onSalvar(id, b64);
              setCapturando(false);
            }}
            onCancel={() => setCapturando(false)}
          />
        </div>
      );
    }
    return (
      <div className="cm-assinatura-card cm-assinatura-card-active">
        <p className="cm-assinatura-title">{titulo}</p>
        <div className="cm-assinatura-status-row cm-assinatura-status-dashed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cliente-mobile/Vector-34.svg"
            alt=""
            className="cm-assinatura-status-icon"
          />
          <span>Aguardando assinatura</span>
        </div>
        <button
          type="button"
          className="cm-btn-solid"
          onClick={() => setCapturando(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cliente-mobile/Vector-36.svg"
            alt=""
            style={{ width: 17, height: 17 }}
          />
          <span>Assinar agora</span>
        </button>
      </div>
    );
  }

  return (
    <div className="cm-assinatura-card">
      <p className="cm-assinatura-title">{titulo}</p>
      <div className="cm-assinatura-status-row centered">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cliente-mobile/Vector-34.svg"
          alt=""
          className="cm-assinatura-status-icon"
        />
        <span>Aguarde a etapa anterior</span>
      </div>
      <button
        type="button"
        className="cm-btn-solid"
        disabled
        style={{ opacity: 0.4, cursor: "not-allowed" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cliente-mobile/Vector-36.svg"
          alt=""
          style={{ width: 17, height: 17 }}
        />
        <span>Assinar AGORA</span>
      </button>
    </div>
  );
}

/* === Main === */
type Props = {
  titularId: number | null | undefined;
  onBack: () => void;
  onAllSigned?: () => void;
};

export default function AssinaturasScreen({
  titularId,
  onBack,
  onAllSigned,
}: Props) {
  const [salvandoTipo, setSalvandoTipo] = useState<string | null>(null);
  const [msgErro, setMsgErro] = useState<string | null>(null);
  const [baixandoContrato, setBaixandoContrato] = useState(false);

  const {
    data: assinaturas = [],
    isLoading,
    refetch,
  } = useQuery<AssinaturaDigital[]>({
    queryKey: ["cliente-assinaturas-mobile", titularId],
    queryFn: () => listarAssinaturas(),
    enabled: Boolean(titularId),
    staleTime: 30 * 1000,
  });

  const assinaturasMap = assinaturas.reduce<Record<string, AssinaturaDigital>>(
    (acc, item) => {
      const tipoCanonical = canonicalAssinaturaTipo(item.tipo);
      acc[tipoCanonical] = item;
      return acc;
    },
    {},
  );

  let proximaEtapa: number = TIPOS_ASSINATURA.length;
  for (let i = 0; i < TIPOS_ASSINATURA.length; i++) {
    if (!assinaturasMap[TIPOS_ASSINATURA[i].id]) {
      proximaEtapa = i;
      break;
    }
  }

  const handleSalvar = useCallback(
    async (tipo: string, assinaturaBase64: string) => {
      setMsgErro(null);
      setSalvandoTipo(tipo);
      try {
        await salvarAssinatura({ tipo, assinaturaBase64 });
        const updated = await refetch();
        const assinaturasAtualizadas = updated.data ?? [];
        const mapaAtualizado = assinaturasAtualizadas.reduce<
          Record<string, AssinaturaDigital>
        >((acc, item) => {
          acc[canonicalAssinaturaTipo(item.tipo)] = item;
          return acc;
        }, {});
        const todasCompletas = TIPOS_ASSINATURA.every((t) =>
          Boolean(mapaAtualizado[t.id]),
        );
        if (todasCompletas && onAllSigned) {
          onAllSigned();
        }
      } catch (err) {
        setMsgErro(
          err instanceof Error
            ? err.message
            : "Não foi possível salvar a assinatura.",
        );
      } finally {
        setSalvandoTipo(null);
      }
    },
    [refetch, onAllSigned],
  );

  const handleDownloadContrato = useCallback(async () => {
    setBaixandoContrato(true);
    try {
      const response = await fetch(CONTRATO_DOWNLOAD_URL, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Não foi possível gerar o contrato em PDF.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "contrato-assinado.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setMsgErro(
        err instanceof Error
          ? err.message
          : "Não foi possível baixar o contrato.",
      );
    } finally {
      setBaixandoContrato(false);
    }
  }, []);

  return (
    <div
      id="screen-assinaturas"
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
          <h1>Assinaturas digitais</h1>
        </div>
      </div>

      <div
        className="cm-panel"
        style={{ padding: 0, borderRadius: "20px 20px 0 0", marginTop: 3 }}
      >
        {!titularId ? (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              color: "var(--cm-gray-400)",
              fontSize: 14,
            }}
          >
            Titular não identificado para vincular assinaturas.
          </div>
        ) : (
          <div className="cm-assinaturas-list">
            <div className="cm-assinatura-card">
              <p className="cm-assinatura-title">
                Contrato de Prestação de Serviço
              </p>
              <p className="cm-assinatura-subtitle">
                Leia o contrato antes de realizar as assinaturas.
              </p>
              <button
                type="button"
                onClick={handleDownloadContrato}
                disabled={baixandoContrato}
                className="cm-btn-outline"
                style={{ textDecoration: "none" }}
              >
                {baixandoContrato ? (
                  <Loader2 size={15} className="cm-spinner" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/cliente-mobile/Vector-20.svg"
                    alt=""
                    style={{ width: 15, height: 15 }}
                  />
                )}
                <span>
                  {baixandoContrato ? "Gerando PDF..." : "Baixar Contrato"}
                </span>
              </button>
            </div>

            {msgErro && (
              <div className="cm-alert cm-alert-danger">
                <span>{msgErro}</span>
              </div>
            )}

            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 16px",
                  gap: 12,
                  color: "var(--cm-gray-400)",
                }}
              >
                <Loader2 size={28} className="cm-spinner" />
                <p style={{ fontSize: 14 }}>Carregando assinaturas...</p>
              </div>
            ) : (
              <>
                {TIPOS_ASSINATURA.map((tipo, index) => (
                  <SignatureCard
                    key={tipo.id}
                    tipoId={tipo.id}
                    titulo={tipo.label}
                    index={index}
                    proximaEtapa={proximaEtapa}
                    assinatura={assinaturasMap[tipo.id]}
                    onSalvar={handleSalvar}
                    salvando={salvandoTipo === tipo.id}
                  />
                ))}

                {proximaEtapa === TIPOS_ASSINATURA.length && (
                  <div className="cm-alert cm-alert-success">
                    <CheckCircle
                      size={16}
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <span>
                      Todas as assinaturas foram coletadas com sucesso.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
