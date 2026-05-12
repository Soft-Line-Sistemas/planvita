"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { ClientePlano } from "@/types/ClientePlano";
import { changePassword } from "@/services/auth-cliente.service";

type Props = {
  cliente: ClientePlano;
  onLogout: () => void;
  onBack: () => void;
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
            <Image
              src="/cliente-mobile/Vector-30.png"
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
              <Image
                src="/cliente-mobile/Vector-21.png"
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

function AlterarFotoModal({ onClose }: { onClose: () => void }) {
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="cm-foto-modal-overlay" role="presentation">
      <div
        className="cm-foto-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="foto-modal-title"
      >
        <button
          type="button"
          className="cm-foto-modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <Image
            src="/cliente-mobile/Vector-39.png"
            alt=""
            width={31}
            height={31}
            aria-hidden
          />
        </button>

        <div className="cm-foto-modal-heading">
          <Image
            src="/cliente-mobile/Vector-49.png"
            alt=""
            width={29}
            height={23}
            aria-hidden
          />
          <h2 id="foto-modal-title">Alterar foto do perfil</h2>
        </div>

        {toast && (
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 13,
              color: "var(--cm-green-primary)",
              textAlign: "center",
            }}
          >
            {toast}
          </p>
        )}

        <div className="cm-foto-modal-actions">
          <button
            type="button"
            className="cm-btn-solid"
            onClick={() => notify("Funcionalidade em breve disponível.")}
          >
            Selecionar da galeria
          </button>
          <button
            type="button"
            className="cm-btn-outline"
            onClick={() => notify("Funcionalidade em breve disponível.")}
          >
            Tirar foto
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================================================================
   AjustesScreen
   =================================================================== */

export default function AjustesScreen({ cliente, onLogout, onBack }: Props) {
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showFotoModal, setShowFotoModal] = useState(false);

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
            <Image
              src="/cliente-mobile/Vector-30.png"
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
            <Image
              src="/cliente-mobile/Vector-32.png"
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
            onClick={() => alert("Alterar dados de contato em breve.")}
          >
            <span className="cm-settings-item-label">
              Alterar dados de contato
            </span>
            <Image
              src="/cliente-mobile/Vector-32.png"
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
            <Image
              src="/cliente-mobile/Vector-32.png"
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
            <Image
              src="/cliente-mobile/Vector.png"
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
        <AlterarFotoModal onClose={() => setShowFotoModal(false)} />
      )}
    </div>
  );
}
