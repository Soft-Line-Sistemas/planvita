"use client";

import { useState } from "react";
import api from "@/utils/api";

type ReenvioChannel = "email" | "whatsapp";

type Props = {
  nomeCliente?: string;
  emailCliente?: string;
  telefoneCliente?: string;
  onAssinar: () => void;
};

export default function ContratoBlockerOverlay({
  nomeCliente,
  emailCliente,
  telefoneCliente,
  onAssinar,
}: Props) {
  const [reenvioLoading, setReenvioLoading] = useState(false);
  const [reenvioSucesso, setReenvioSucesso] = useState<ReenvioChannel | null>(
    null,
  );
  const [reenvioErro, setReenvioErro] = useState<string | null>(null);

  const nome = nomeCliente?.split(" ")[0] ?? "Cliente";

  const canEmail = Boolean(emailCliente?.includes("@"));
  const canWhatsapp = Boolean(
    telefoneCliente && telefoneCliente.replace(/\D/g, "").length >= 8,
  );

  async function reenviarLink(channel: ReenvioChannel) {
    setReenvioLoading(true);
    setReenvioErro(null);
    setReenvioSucesso(null);
    try {
      await api.post("/auth/contrato/reenviar-link", { channel });
      setReenvioSucesso(channel);
    } catch {
      setReenvioErro(
        "Não foi possível reenviar o link. Tente novamente em instantes.",
      );
    } finally {
      setReenvioLoading(false);
    }
  }

  return (
    <div
      className="cb-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cb-title"
    >
      <div className="cb-card">
        {/* Ícone */}
        <div className="cb-icon-wrap" aria-hidden>
          <svg
            className="cb-icon"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="24" cy="24" r="24" fill="#FFF3CD" />
            <path
              d="M24 14v13M24 31v2"
              stroke="#B45309"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M12 34L24 13l12 21H12z"
              stroke="#B45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Título */}
        <h2 id="cb-title" className="cb-title">
          Contrato pendente
        </h2>

        {/* Mensagem */}
        <p className="cb-message">
          Olá, <strong>{nome}</strong>! Você ainda não assinou o contrato
          eletrônico. Por favor, assine o contrato para continuar usando o
          aplicativo.
        </p>

        {/* CTA principal */}
        <button type="button" className="cb-btn-primary" onClick={onAssinar}>
          Assinar contrato agora
        </button>

        {/* Divisor */}
        <div className="cb-divider">
          <span>ou receber o link por</span>
        </div>

        {/* Reenvio de link */}
        {(canEmail || canWhatsapp) && (
          <div className="cb-reenvio-row">
            {canEmail && (
              <button
                type="button"
                className="cb-btn-channel"
                disabled={reenvioLoading}
                onClick={() => reenviarLink("email")}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="cb-channel-icon"
                  aria-hidden
                >
                  <rect
                    x="2"
                    y="4"
                    width="16"
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2 7l8 5 8-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                E-mail
              </button>
            )}
            {canWhatsapp && (
              <button
                type="button"
                className="cb-btn-channel"
                disabled={reenvioLoading}
                onClick={() => reenviarLink("whatsapp")}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="cb-channel-icon"
                  aria-hidden
                >
                  <path
                    d="M10 2a8 8 0 0 1 6.928 12L18 18l-4.072-1.072A8 8 0 1 1 10 2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 9c0 3 2 5 6 6l1-2-2-1-1 1c-1-1-2-2-2-3l1-1-1-2-2 2z"
                    fill="currentColor"
                  />
                </svg>
                WhatsApp
              </button>
            )}
          </div>
        )}

        {/* Feedback de reenvio */}
        {reenvioLoading && (
          <p className="cb-feedback cb-feedback--loading">Enviando link…</p>
        )}
        {reenvioSucesso && !reenvioLoading && (
          <p className="cb-feedback cb-feedback--success">
            Link enviado para seu{" "}
            {reenvioSucesso === "email" ? "e-mail" : "WhatsApp"}. Verifique sua
            caixa de entrada.
          </p>
        )}
        {reenvioErro && !reenvioLoading && (
          <p className="cb-feedback cb-feedback--error">{reenvioErro}</p>
        )}
      </div>
    </div>
  );
}
