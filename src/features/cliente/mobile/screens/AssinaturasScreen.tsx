"use client";

import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle } from "lucide-react";
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

const TIPOS_ASSINATURA_IDS = new Set(TIPOS_ASSINATURA.map((item) => item.id));
const ASSINATURA_TIPO_ALIASES: Record<string, string> = {
  TITULARASSINATURA1: "TITULAR_ASSINATURA_1",
  TITULARASSINATURA2: "TITULAR_ASSINATURA_2",
  CORRESPONSAVELASSINATURA1: "CORRESPONSAVEL_ASSINATURA_1",
  CORRESPONSAVELASSINATURA2: "CORRESPONSAVEL_ASSINATURA_2",
};

const CONTRATO_URL = "/docs/contrato.docx";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
const ASSINATURA_API_BASE = API_BASE_URL
  ? `${API_BASE_URL}/${API_VERSION}`
  : undefined;

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
        <div className="cm-assinatura-status-row">
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
              src="/cliente-mobile/Vector-20.png"
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
            src="/cliente-mobile/Vector-34.png"
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
            src="/cliente-mobile/Vector-36.png"
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
      <div className="cm-assinatura-status-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cliente-mobile/Vector-34.png"
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
          src="/cliente-mobile/Vector-36.png"
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
};

export default function AssinaturasScreen({ titularId, onBack }: Props) {
  const [salvandoTipo, setSalvandoTipo] = useState<string | null>(null);
  const [msgErro, setMsgErro] = useState<string | null>(null);

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
        await refetch();
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
    [refetch],
  );

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
              src="/cliente-mobile/Vector-30.png"
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
              <a
                href={CONTRATO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="cm-btn-outline"
                style={{ textDecoration: "none" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cliente-mobile/Vector-20.png"
                  alt=""
                  style={{ width: 15, height: 15 }}
                />
                <span>Baixar Contrato</span>
              </a>
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
