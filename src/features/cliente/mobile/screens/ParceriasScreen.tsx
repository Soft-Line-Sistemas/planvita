"use client";

import Image from "next/image";

type Props = {
  onBack: () => void;
};

export default function ParceriasScreen({ onBack }: Props) {
  return (
    <div
      id="screen-parcerias"
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
          <h1>Parcerias e Vantagens</h1>
        </div>
      </div>

      {/* ── Panel ── */}
      <div
        className="cm-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cliente-mobile/Vector-1.svg"
            alt=""
            style={{ width: 64, height: 64, opacity: 0.2, marginBottom: 24 }}
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
            Estamos preparando parcerias e vantagens exclusivas para os membros
            do plano. Em breve você poderá acessar descontos e benefícios
            incríveis aqui.
          </p>

          {/* Decorative badge */}
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
      </div>
    </div>
  );
}
