"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Lock,
  FileX,
} from "lucide-react";
import "@/app/styles/cliente-mobile.css";

type Etapa = "aviso" | "confirmacao" | "email-enviado";

const CONSEQUENCIAS = [
  {
    icon: Lock,
    titulo: "Acesso bloqueado",
    descricao:
      "Você não conseguirá mais acessar o aplicativo com estas credenciais.",
  },
  {
    icon: FileX,
    titulo: "Plano cancelado",
    descricao:
      "A cobrança recorrente do seu plano de assistência será encerrada.",
  },
  {
    icon: ShieldAlert,
    titulo: "Dados removidos",
    descricao:
      "Seus dados pessoais serão excluídos, respeitando obrigações legais.",
  },
];

export function ExcluirContaClient() {
  const [etapa, setEtapa] = useState<Etapa>("aviso");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSolicitarExclusao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Informe o e-mail cadastrado na sua conta.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/excluir-conta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Não foi possível processar a solicitação. Tente novamente.",
        );
      }

      setEtapa("email-enviado");
    } catch (err) {
      const e = err as Error;
      setError(e.message || "Erro inesperado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
          background: #f4f6f8;
          -webkit-font-smoothing: antialiased;
        }

        .ec-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(160deg, #f0faf0 0%, #f4f6f8 50%, #fef5f5 100%);
        }

        .ec-header {
          width: 100%;
          background: linear-gradient(135deg, #2d7a1f 0%, #3a9b28 60%, #1eba4b 100%);
          padding: 20px 24px;
          padding-top: calc(20px + env(safe-area-inset-top));
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ec-header-logo {
          filter: brightness(0) invert(1);
        }

        .ec-header-divider {
          width: 1px;
          height: 28px;
          background: rgba(255,255,255,0.4);
        }

        .ec-header-title {
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          opacity: 0.9;
          margin: 0;
        }

        .ec-card {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          padding: 0 16px 40px;
          padding-bottom: calc(40px + env(safe-area-inset-bottom));
        }

        /* === AVISO === */
        .ec-hero {
          background: #fff;
          border-radius: 20px;
          padding: 28px 24px 24px;
          margin-top: 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          text-align: center;
        }

        .ec-hero-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #fff0f0;
          border: 2px solid #ffd6d6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .ec-hero-title {
          font-size: 20px;
          font-weight: 800;
          color: #212121;
          margin: 0 0 8px;
          line-height: 1.3;
        }

        .ec-hero-sub {
          font-size: 14px;
          color: #616161;
          line-height: 1.6;
          margin: 0;
        }

        .ec-consequences {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }

        .ec-consequence-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          padding: 14px;
          text-align: left;
        }

        .ec-consequence-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #fff0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ec-consequence-title {
          font-size: 13px;
          font-weight: 700;
          color: #212121;
          margin: 0 0 2px;
        }

        .ec-consequence-desc {
          font-size: 12px;
          color: #757575;
          line-height: 1.5;
          margin: 0;
        }

        .ec-warning-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff8e1;
          border: 1px solid #ffe082;
          border-radius: 12px;
          padding: 14px;
          margin-top: 20px;
          font-size: 13px;
          color: #7c5700;
          font-weight: 500;
          line-height: 1.5;
          text-align: left;
        }

        .ec-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 24px;
        }

        .ec-btn-danger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 52px;
          background: #e53935;
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
          box-shadow: 0 4px 14px rgba(229,57,53,0.35);
          -webkit-tap-highlight-color: transparent;
          transition: filter 0.15s;
          text-decoration: none;
        }

        .ec-btn-danger:active {
          filter: brightness(0.88);
        }

        .ec-btn-neutral {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 46px;
          background: #fff;
          border: 1.5px solid #9e9e9e;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          color: #424242;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-tap-highlight-color: transparent;
          transition: background 0.15s;
          text-decoration: none;
        }

        .ec-btn-neutral:active {
          background: #f5f5f5;
        }

        /* === CONFIRMAÇÃO === */
        .ec-form-card {
          background: #fff;
          border-radius: 20px;
          padding: 28px 24px 24px;
          margin-top: 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
        }

        .ec-form-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .ec-form-heading h2 {
          font-size: 18px;
          font-weight: 800;
          color: #212121;
          margin: 0;
        }

        .ec-form-desc {
          font-size: 14px;
          color: #616161;
          line-height: 1.6;
          margin: 0 0 20px;
        }

        .ec-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }

        .ec-input-label {
          font-size: 13px;
          font-weight: 600;
          color: #424242;
        }

        .ec-input {
          width: 100%;
          height: 50px;
          border: 1.5px solid #e0e0e0;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 15px;
          font-family: 'Inter', system-ui, sans-serif;
          color: #212121;
          background: #fafafa;
          outline: none;
          transition: border-color 0.15s;
        }

        .ec-input:focus {
          border-color: #e53935;
          background: #fff;
        }

        .ec-alert-danger {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #fdecea;
          border: 1px solid #f5c6c6;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 13px;
          color: #c62828;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .ec-btn-danger:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ec-spinner {
          animation: ec-spin 0.8s linear infinite;
        }

        @keyframes ec-spin {
          to { transform: rotate(360deg); }
        }

        /* === SUCESSO === */
        .ec-success-card {
          background: #fff;
          border-radius: 20px;
          padding: 40px 24px;
          margin-top: 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          text-align: center;
        }

        .ec-success-icon-wrap {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #e8f5e3;
          border: 2px solid #a5d6a7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .ec-success-title {
          font-size: 20px;
          font-weight: 800;
          color: #212121;
          margin: 0 0 10px;
        }

        .ec-success-desc {
          font-size: 14px;
          color: #616161;
          line-height: 1.7;
          margin: 0 0 24px;
        }

        .ec-success-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #e8f5e3;
          border: 1px solid #c8e6c9;
          border-radius: 12px;
          padding: 14px;
          font-size: 13px;
          color: #2e7d32;
          line-height: 1.5;
          text-align: left;
        }

        /* === FOOTER === */
        .ec-footer {
          text-align: center;
          padding: 32px 24px 24px;
          font-size: 12px;
          color: #9e9e9e;
          line-height: 1.6;
        }

        .ec-footer a {
          color: #3a9b28;
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>

      <div className="ec-page">
        {/* Header */}
        <header className="ec-header">
          <Image
            src="/cliente-mobile/logo.svg"
            alt="Campo do Bosque"
            width={110}
            height={30}
            className="ec-header-logo"
            priority
          />
          <div className="ec-header-divider" />
          <p className="ec-header-title">Exclusão de conta</p>
        </header>

        <div className="ec-card">
          {etapa === "aviso" && (
            <EtapaAviso onAvancar={() => setEtapa("confirmacao")} />
          )}

          {etapa === "confirmacao" && (
            <EtapaConfirmacao
              email={email}
              setEmail={setEmail}
              loading={loading}
              error={error}
              onVoltar={() => {
                setEtapa("aviso");
                setError(null);
              }}
              onSubmit={handleSolicitarExclusao}
            />
          )}

          {etapa === "email-enviado" && <EtapaEmailEnviado email={email} />}
        </div>

        <footer className="ec-footer">
          Campo do Bosque — Plataforma de Assistência Funeral
          <br />
          <a href="/privacidade">Política de Privacidade</a>
          {" · "}
          <a href="/cliente">Ir para o app</a>
        </footer>
      </div>
    </>
  );
}

/* ── Etapa 1: Aviso ─────────────────────────────────────────── */

function EtapaAviso({ onAvancar }: { onAvancar: () => void }) {
  return (
    <>
      <div className="ec-hero">
        <div className="ec-hero-icon-wrap">
          <Trash2 size={32} color="#e53935" />
        </div>

        <h1 className="ec-hero-title">Excluir sua conta</h1>
        <p className="ec-hero-sub">
          Antes de prosseguir, entenda o que acontece ao solicitar a exclusão da
          sua conta.
        </p>

        <div className="ec-consequences">
          {CONSEQUENCIAS.map(({ icon: Icon, titulo, descricao }) => (
            <div key={titulo} className="ec-consequence-item">
              <div className="ec-consequence-icon">
                <Icon size={18} color="#e53935" />
              </div>
              <div>
                <p className="ec-consequence-title">{titulo}</p>
                <p className="ec-consequence-desc">{descricao}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ec-warning-banner">
          <AlertTriangle
            size={18}
            color="#f9a825"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <span>
            Esta ação <strong>não pode ser desfeita</strong>. Se tiver dúvidas,
            entre em contato com nosso suporte antes de continuar.
          </span>
        </div>
      </div>

      <div className="ec-actions">
        <button type="button" className="ec-btn-danger" onClick={onAvancar}>
          <Trash2 size={18} />
          Quero excluir minha conta
        </button>
        <a href="/cliente" className="ec-btn-neutral">
          Cancelar e voltar ao app
        </a>
      </div>
    </>
  );
}

/* ── Etapa 2: Confirmação ───────────────────────────────────── */

function EtapaConfirmacao({
  email,
  setEmail,
  loading,
  error,
  onVoltar,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string | null;
  onVoltar: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <div className="ec-form-card">
        <div className="ec-form-heading">
          <Trash2 size={22} color="#e53935" />
          <h2>Confirmar exclusão</h2>
        </div>

        <p className="ec-form-desc">
          Informe o e-mail cadastrado na sua conta para confirmar a solicitação.
          Você receberá uma confirmação após o processamento.
        </p>

        <form onSubmit={onSubmit} noValidate>
          <div className="ec-input-group">
            <label htmlFor="ec-email" className="ec-input-label">
              E-mail cadastrado
            </label>
            <input
              id="ec-email"
              type="email"
              className="ec-input"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="ec-alert-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="ec-actions" style={{ marginTop: 0 }}>
            <button
              type="submit"
              className="ec-btn-danger"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="ec-spinner" />
                  Processando...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Excluir minha conta
                </>
              )}
            </button>
            <button
              type="button"
              className="ec-btn-neutral"
              onClick={onVoltar}
              disabled={loading}
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ── Etapa 3: E-mail enviado ────────────────────────────────── */

function EtapaEmailEnviado({ email }: { email: string }) {
  return (
    <div className="ec-success-card">
      <div className="ec-success-icon-wrap">
        <CheckCircle size={38} color="#3a9b28" />
      </div>

      <h2 className="ec-success-title">Verifique seu e-mail</h2>
      <p className="ec-success-desc">
        Enviamos um link de confirmação para <strong>{email}</strong>. Clique no
        link do e-mail para concluir a exclusão da sua conta.
      </p>

      <div className="ec-success-note">
        <CheckCircle
          size={16}
          color="#2e7d32"
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <span>
          O link expira em <strong>60 minutos</strong>. Se não encontrar o
          e-mail, verifique a pasta de spam.
        </span>
      </div>
    </div>
  );
}
