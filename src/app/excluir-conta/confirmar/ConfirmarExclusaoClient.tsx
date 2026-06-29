"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";

type Estado =
  | "carregando"
  | "confirmando"
  | "sucesso"
  | "erro"
  | "token-ausente";

export function ConfirmarExclusaoClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const tenant = searchParams.get("tenant") ?? "";

  const [estado, setEstado] = useState<Estado>(
    token ? "carregando" : "token-ausente",
  );
  const [erroMsg, setErroMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    // Pequena pausa para mostrar o estado de carregando antes de confirmar
    const t = setTimeout(() => setEstado("confirmando"), 600);
    return () => clearTimeout(t);
  }, [token]);

  const handleConfirmar = async () => {
    setEstado("carregando");
    try {
      const res = await fetch("/api/confirmar-exclusao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tenant }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Não foi possível confirmar a exclusão. Tente novamente.",
        );
      }

      setEstado("sucesso");
    } catch (err) {
      const e = err as Error;
      setErroMsg(e.message || "Erro inesperado. Tente novamente mais tarde.");
      setEstado("erro");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', system-ui, sans-serif; background: #f4f6f8; -webkit-font-smoothing: antialiased; }

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

        .ec-header-logo { filter: brightness(0) invert(1); }

        .ec-header-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.4); }

        .ec-header-title { color: #fff; font-size: 15px; font-weight: 600; opacity: 0.9; margin: 0; }

        .ec-card {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          padding: 24px 16px 40px;
          padding-bottom: calc(40px + env(safe-area-inset-bottom));
        }

        .ec-panel {
          background: #fff;
          border-radius: 20px;
          padding: 36px 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          text-align: center;
        }

        .ec-icon-wrap {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .ec-icon-red { background: #fff0f0; border: 2px solid #ffd6d6; }
        .ec-icon-green { background: #e8f5e3; border: 2px solid #c8e6c9; }
        .ec-icon-gray { background: #f5f5f5; border: 2px solid #e0e0e0; }
        .ec-icon-orange { background: #fff8e1; border: 2px solid #ffe082; }

        .ec-title { font-size: 20px; font-weight: 800; color: #212121; margin: 0 0 10px; }
        .ec-desc { font-size: 14px; color: #616161; line-height: 1.7; margin: 0 0 24px; }

        .ec-warning {
          background: #fff0f0;
          border: 1px solid #ffd6d6;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 13px;
          color: #c62828;
          line-height: 1.6;
          margin-bottom: 24px;
          text-align: left;
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
          margin-bottom: 10px;
        }

        .ec-btn-danger:active { filter: brightness(0.88); }
        .ec-btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

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
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
        }

        .ec-btn-neutral:active { background: #f5f5f5; }

        .ec-spinner { animation: ec-spin 0.8s linear infinite; }
        @keyframes ec-spin { to { transform: rotate(360deg); } }

        .ec-footer {
          text-align: center;
          padding: 32px 24px 24px;
          font-size: 12px;
          color: #9e9e9e;
          line-height: 1.6;
        }

        .ec-footer a { color: #3a9b28; text-decoration: none; font-weight: 500; }
      `}</style>

      <div className="ec-page">
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
          <div className="ec-panel">
            {estado === "carregando" && <EstadoCarregando />}
            {estado === "confirmando" && (
              <EstadoConfirmando onConfirmar={handleConfirmar} />
            )}
            {estado === "sucesso" && <EstadoSucesso />}
            {estado === "erro" && <EstadoErro mensagem={erroMsg} />}
            {estado === "token-ausente" && <EstadoTokenAusente />}
          </div>
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

function EstadoCarregando() {
  return (
    <>
      <div className="ec-icon-wrap ec-icon-gray">
        <Loader2 size={32} color="#9e9e9e" className="ec-spinner" />
      </div>
      <p className="ec-title">Verificando link…</p>
      <p className="ec-desc">Aguarde um instante.</p>
    </>
  );
}

function EstadoConfirmando({ onConfirmar }: { onConfirmar: () => void }) {
  return (
    <>
      <div className="ec-icon-wrap ec-icon-red">
        <Trash2 size={32} color="#e53935" />
      </div>
      <p className="ec-title">Confirmar exclusão</p>
      <p className="ec-desc">
        Você está prestes a excluir sua conta permanentemente. Seu acesso ao
        aplicativo será bloqueado e o plano será cancelado.
      </p>
      <div className="ec-warning">
        <strong>Esta ação não pode ser desfeita.</strong> Após confirmar, não
        será possível recuperar sua conta ou histórico.
      </div>
      <button type="button" className="ec-btn-danger" onClick={onConfirmar}>
        <Trash2 size={18} />
        Sim, excluir minha conta
      </button>
      <a href="/excluir-conta" className="ec-btn-neutral">
        Cancelar
      </a>
    </>
  );
}

function EstadoSucesso() {
  return (
    <>
      <div className="ec-icon-wrap ec-icon-green">
        <CheckCircle size={36} color="#3a9b28" />
      </div>
      <p className="ec-title">Conta excluída</p>
      <p className="ec-desc">
        Sua conta foi encerrada com sucesso. Seus dados pessoais serão excluídos
        em até <strong>5 dias úteis</strong>, respeitando obrigações legais.
      </p>
      <a href="/cliente" className="ec-btn-neutral">
        Ir para o início
      </a>
    </>
  );
}

function EstadoErro({ mensagem }: { mensagem: string }) {
  return (
    <>
      <div className="ec-icon-wrap ec-icon-orange">
        <XCircle size={32} color="#f9a825" />
      </div>
      <p className="ec-title">Link inválido ou expirado</p>
      <p className="ec-desc">{mensagem}</p>
      <a
        href="/excluir-conta"
        className="ec-btn-danger"
        style={{ textDecoration: "none" }}
      >
        Solicitar novo link
      </a>
    </>
  );
}

function EstadoTokenAusente() {
  return (
    <>
      <div className="ec-icon-wrap ec-icon-orange">
        <XCircle size={32} color="#f9a825" />
      </div>
      <p className="ec-title">Link inválido</p>
      <p className="ec-desc">
        Este link está incompleto. Acesse a página de exclusão de conta e
        solicite um novo link pelo seu e-mail cadastrado.
      </p>
      <a
        href="/excluir-conta"
        className="ec-btn-danger"
        style={{ textDecoration: "none" }}
      >
        Solicitar exclusão
      </a>
    </>
  );
}
