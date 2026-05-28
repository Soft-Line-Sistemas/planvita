"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { Loader2, CheckCircle, AlertCircle, MessageCircle } from "lucide-react";
import type { ClientePlano } from "@/types/ClientePlano";
import { changePassword } from "@/services/auth-cliente.service";
import {
  removerFotoPerfilCliente,
  salvarFotoPerfilCliente,
} from "@/services/cliente-ajustes.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  cliente: ClientePlano;
  onLogout: () => void;
  onBack: () => void;
  onFotoPerfilChange: (fotoPerfilUrl: string | null) => void;
  openFotoModalOnEnter?: boolean;
  onOpenFotoModalHandled?: () => void;
};

/* ===================================================================
   Helpers
   =================================================================== */

function validatePassword(value: string): string | null {
  if (!value || value.length < 8)
    return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Za-z]/.test(value)) return "A senha deve ter pelo menos 1 letra.";
  if (!/\d/.test(value)) return "A senha deve ter pelo menos 1 número.";
  if (!/[^A-Za-z0-9]/.test(value))
    return "A senha deve ter pelo menos 1 caractere especial.";
  return null;
}

function extractMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: unknown } } };
  return typeof e?.response?.data?.message === "string"
    ? e.response.data.message
    : "Não foi possível alterar a senha.";
}

const FOTO_MAX_BYTES = 5 * 1024 * 1024;
const FOTO_ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const CROP_SIZE = 240;
const CROP_OUTPUT_SIZE = 512;
const CENTRAL_WHATSAPP_NUMBER = "557130347323";
const CONTRATO_UPDATE_WHATSAPP_MESSAGE =
  "Olá! Gostaria de solicitar a alteração dos dados do meu contrato.";

function formatFotoMessage(err: unknown): string {
  const e = err as {
    message?: string;
    response?: { status?: number; data?: { message?: unknown } };
  };
  const message =
    typeof e?.response?.data?.message === "string"
      ? e.response.data.message
      : null;
  if (message) return message;
  if (typeof e?.message === "string" && e.message.trim()) {
    return `Falha ao enviar foto: ${e.message}`;
  }
  if (typeof e?.response?.status === "number") {
    return `Falha ao enviar foto (HTTP ${e.response.status}).`;
  }
  return "Não foi possível alterar a foto do perfil.";
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Falha ao processar arquivo."));
    };
    reader.onerror = () => reject(new Error("Falha ao processar arquivo."));
    reader.readAsDataURL(file);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem."));
    img.src = src;
  });
}

/* ===================================================================
   Change Password — full-screen style (matching new-ui alterar-senha)
   =================================================================== */

function AlterarSenhaView({ onClose }: { onClose: () => void }) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPwd) {
      setError("Informe sua senha atual.");
      return;
    }
    const pwdErr = validatePassword(newPwd);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      id="screen-alterar-senha"
    >
      <div className="cm-app-header">
        <div className="cm-app-header-row">
          <button
            type="button"
            className="cm-btn-back"
            onClick={onClose}
            aria-label="Voltar"
          >
            <NextImage
              src="/cliente-mobile/Vector-30.svg"
              alt=""
              width={20}
              height={17}
              aria-hidden
            />
          </button>
          <h1>Alterar senha</h1>
        </div>
      </div>

      <div className="cm-panel cm-alterar-senha-panel">
        {success ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "24px 0",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--cm-green-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={28} color="var(--cm-green-action)" />
            </div>
            <p
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "var(--cm-gray-800)",
              }}
            >
              Senha alterada!
            </p>
            <p style={{ fontSize: 14, color: "var(--cm-gray-600)" }}>
              Sua senha foi atualizada com sucesso.
            </p>
          </div>
        ) : (
          <>
            <div className="cm-alterar-senha-heading">
              <NextImage
                src="/cliente-mobile/Vector-21.svg"
                alt=""
                width={22}
                height={26}
                aria-hidden
              />
              <h2>Crie sua senha de acesso</h2>
            </div>

            <div className="cm-alterar-senha-criteria">
              <p className="cm-alterar-senha-criteria-title">
                Critérios da senha:
              </p>
              <ul className="cm-alterar-senha-criteria-list">
                <li>Letra maiúscula no primeiro caractere;</li>
                <li>No mínimo 1 número;</li>
                <li>No mínimo 1 letra minúscula</li>
                <li>No mínimo 1 caractere especial válido (@$#);</li>
                <li>Total de 8 caracteres válidos;</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="cm-alterar-senha-form">
              <input
                type="password"
                className="cm-input"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Senha"
                autoComplete="current-password"
              />
              <input
                type="password"
                className="cm-input"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Nova Senha"
                autoComplete="new-password"
              />
              <input
                type="password"
                className="cm-input"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Confirmar a nova senha"
                autoComplete="new-password"
              />

              {error && (
                <div className="cm-alert cm-alert-danger">
                  <AlertCircle
                    size={15}
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="cm-btn-solid cm-alterar-senha-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="cm-spinner" /> Salvando...
                  </>
                ) : (
                  "Enviar"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ===================================================================
   Foto de Perfil Modal
   =================================================================== */

function AlterarFotoModal({
  hasFotoPerfil,
  onClose,
  onFotoPerfilChange,
}: {
  hasFotoPerfil: boolean;
  onClose: () => void;
  onFotoPerfilChange: (fotoPerfilUrl: string | null) => void;
}) {
  const inputGaleriaRef = useRef<HTMLInputElement | null>(null);
  const inputCameraRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [draftFilename, setDraftFilename] = useState<string>("foto-perfil.png");
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });

  const baseScale = imgNatural
    ? Math.max(CROP_SIZE / imgNatural.w, CROP_SIZE / imgNatural.h)
    : 1;
  const renderScale = baseScale * zoom;
  const renderW = imgNatural ? imgNatural.w * renderScale : CROP_SIZE;
  const renderH = imgNatural ? imgNatural.h * renderScale : CROP_SIZE;
  const maxOffsetX = Math.max(0, (renderW - CROP_SIZE) / 2);
  const maxOffsetY = Math.max(0, (renderH - CROP_SIZE) / 2);

  const clampOffset = (next: { x: number; y: number }) => ({
    x: clamp(next.x, -maxOffsetX, maxOffsetX),
    y: clamp(next.y, -maxOffsetY, maxOffsetY),
  });

  useEffect(() => {
    setOffset((prev) => clampOffset(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, imgNatural?.w, imgNatural?.h]);

  const handleSelecionarArquivo = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMessage(null);
    setError(null);

    if (!FOTO_ALLOWED_MIME.includes(file.type)) {
      setError("Formato inválido. Envie PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > FOTO_MAX_BYTES) {
      setError("Arquivo acima de 5MB. Escolha uma imagem menor.");
      return;
    }

    setLoading(true);
    try {
      const imageBase64 = await fileToBase64(file);
      const img = await loadImage(imageBase64);
      setDraftImage(imageBase64);
      setDraftFilename(file.name || "foto-perfil.png");
      setImgNatural({
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height,
      });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } catch (err) {
      setError(formatFotoMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draftImage) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({ x: event.clientX, y: event.clientY });
    setOffsetStart(offset);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    setOffset(clampOffset({ x: offsetStart.x + dx, y: offsetStart.y + dy }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragStart(null);
  };

  const handleConfirmarRecorte = async () => {
    if (!draftImage || !imgNatural) return;

    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const img = await loadImage(draftImage);
      const canvas = document.createElement("canvas");
      canvas.width = CROP_OUTPUT_SIZE;
      canvas.height = CROP_OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Falha ao preparar recorte.");

      const scale = renderScale;
      const sw = CROP_SIZE / scale;
      const sh = sw;
      const sx = (renderW / 2 - CROP_SIZE / 2 - offset.x) / scale;
      const sy = (renderH / 2 - CROP_SIZE / 2 - offset.y) / scale;
      const sxClamped = clamp(sx, 0, Math.max(0, imgNatural.w - sw));
      const syClamped = clamp(sy, 0, Math.max(0, imgNatural.h - sh));

      ctx.clearRect(0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        CROP_OUTPUT_SIZE / 2,
        CROP_OUTPUT_SIZE / 2,
        CROP_OUTPUT_SIZE / 2,
        0,
        Math.PI * 2,
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        img,
        sxClamped,
        syClamped,
        sw,
        sh,
        0,
        0,
        CROP_OUTPUT_SIZE,
        CROP_OUTPUT_SIZE,
      );
      ctx.restore();

      const imageBase64 = canvas.toDataURL("image/png");
      const foto = await salvarFotoPerfilCliente({
        imageBase64,
        filename: draftFilename,
        mimeType: "image/png",
      });
      onFotoPerfilChange(foto?.arquivoUrl ?? null);
      setMessage("Foto atualizada com sucesso.");
      setDraftImage(null);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(formatFotoMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemover = async () => {
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      await removerFotoPerfilCliente();
      onFotoPerfilChange(null);
      setMessage("Foto removida com sucesso.");
      setTimeout(onClose, 900);
    } catch (err) {
      setError(formatFotoMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="cm-foto-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="cm-foto-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="foto-modal-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <button
          type="button"
          className="cm-foto-modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <NextImage
            src="/cliente-mobile/Vector-39.svg"
            alt=""
            width={31}
            height={31}
            aria-hidden
          />
        </button>

        <div className="cm-foto-modal-heading">
          <NextImage
            src="/cliente-mobile/Vector-49.svg"
            alt=""
            width={29}
            height={23}
            aria-hidden
          />
          <h2 id="foto-modal-title">Alterar foto do perfil</h2>
        </div>

        {message && <div className="cm-alert cm-alert-success">{message}</div>}
        {error && (
          <div className="cm-alert cm-alert-danger">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="cm-foto-modal-actions">
          <input
            ref={inputGaleriaRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleSelecionarArquivo}
            style={{ display: "none" }}
          />
          <input
            ref={inputCameraRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleSelecionarArquivo}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="cm-btn-solid"
            onClick={() => inputGaleriaRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="cm-spinner" /> Enviando...
              </>
            ) : (
              "Selecionar da galeria"
            )}
          </button>
          <button
            type="button"
            className="cm-btn-outline"
            onClick={() => inputCameraRef.current?.click()}
            disabled={loading}
          >
            Tirar foto
          </button>
          {draftImage && imgNatural && (
            <div style={{ marginTop: 8 }}>
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  borderRadius: "50%",
                  overflow: "hidden",
                  margin: "0 auto 10px",
                  border: "2px solid #d7d7d7",
                  position: "relative",
                  touchAction: "none",
                  background: "#f3f3f3",
                  cursor: "grab",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draftImage}
                  alt="Pré-visualização da foto"
                  draggable={false}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: `${renderW}px`,
                    height: `${renderH}px`,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    userSelect: "none",
                    maxWidth: "none",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 10 }}
              />
              <button
                type="button"
                className="cm-btn-solid"
                onClick={handleConfirmarRecorte}
                disabled={loading}
              >
                Confirmar recorte
              </button>
            </div>
          )}
          {hasFotoPerfil && (
            <button
              type="button"
              className="cm-btn-outline"
              onClick={handleRemover}
              disabled={loading}
            >
              Remover foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================================================================
   AjustesScreen
   =================================================================== */

export default function AjustesScreen({
  cliente,
  onLogout,
  onBack,
  onFotoPerfilChange,
  openFotoModalOnEnter = false,
  onOpenFotoModalHandled,
}: Props) {
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [showContatoModal, setShowContatoModal] = useState(false);

  useEffect(() => {
    if (!openFotoModalOnEnter) return;
    setShowFotoModal(true);
    onOpenFotoModalHandled?.();
  }, [openFotoModalOnEnter, onOpenFotoModalHandled]);

  if (showChangePwd) {
    return <AlterarSenhaView onClose={() => setShowChangePwd(false)} />;
  }

  return (
    <div
      id="screen-ajustes"
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
            <NextImage
              src="/cliente-mobile/Vector-30.svg"
              alt=""
              width={20}
              height={17}
              aria-hidden
            />
          </button>
          <h1>Ajustes</h1>
        </div>
      </div>

      {/* White panel */}
      <div
        className="cm-panel"
        style={{
          padding: 0,
          borderRadius: "20px 20px 0 0",
          marginTop: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="cm-settings-list" style={{ padding: "8px 16px" }}>
          <button
            type="button"
            className="cm-settings-item"
            onClick={() => setShowChangePwd(true)}
          >
            <span className="cm-settings-item-label">Alterar senha</span>
            <NextImage
              src="/cliente-mobile/Vector-32.svg"
              alt=""
              width={12}
              height={12}
              className="cm-settings-arrow"
              aria-hidden
            />
          </button>

          <button
            type="button"
            className="cm-settings-item"
            onClick={() => setShowContatoModal(true)}
          >
            <span className="cm-settings-item-label">
              Alterar dados de contato
            </span>
            <NextImage
              src="/cliente-mobile/Vector-32.svg"
              alt=""
              width={12}
              height={12}
              className="cm-settings-arrow"
              aria-hidden
            />
          </button>

          <button
            type="button"
            className="cm-settings-item"
            onClick={() => setShowFotoModal(true)}
          >
            <span className="cm-settings-item-label">
              Alterar foto de Perfil
            </span>
            <NextImage
              src="/cliente-mobile/Vector-32.svg"
              alt=""
              width={12}
              height={12}
              className="cm-settings-arrow"
              aria-hidden
            />
          </button>
        </div>

        <div style={{ padding: "32px 16px 16px", marginTop: "auto" }}>
          <button
            type="button"
            className="cm-btn-solid"
            onClick={onLogout}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <NextImage
              src="/cliente-mobile/Vector.svg"
              alt=""
              width={14}
              height={14}
              aria-hidden
            />
            <span>Sair do Aplicativo</span>
          </button>
        </div>
      </div>

      {showFotoModal && (
        <AlterarFotoModal
          hasFotoPerfil={Boolean(cliente.fotoPerfilUrl)}
          onClose={() => setShowFotoModal(false)}
          onFotoPerfilChange={onFotoPerfilChange}
        />
      )}

      <Dialog open={showContatoModal} onOpenChange={setShowContatoModal}>
        <DialogContent className="max-w-[92vw] rounded-2xl">
          <DialogHeader>
            <div className="flex justify-center pb-1">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <MessageCircle aria-hidden className="h-6 w-6 text-green-700" />
              </span>
            </div>
            <DialogTitle className="text-center">
              Alteração de dados do contrato
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Para sua segurança, essa solicitação é feita pela nossa Central de
              Atendimento.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <button
              type="button"
              className="cm-btn-solid w-full"
              onClick={() =>
                window.open(
                  `https://wa.me/${CENTRAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(CONTRATO_UPDATE_WHATSAPP_MESSAGE)}`,
                  "_blank",
                )
              }
            >
              Ir para o WhatsApp
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
