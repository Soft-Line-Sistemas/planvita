"use client";

import Image from "next/image";
import type { ClientePlano } from "@/types/ClientePlano";

type Props = {
  cliente: ClientePlano;
  onBack: () => void;
};

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getAge(birthDate: string): number | null {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const hoje = new Date();
  let age = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) age--;
  return age;
}

export default function DependentesScreen({ cliente, onBack }: Props) {
  const deps = cliente.dependentes ?? [];

  return (
    <div
      id="screen-dependentes"
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
              src="/cliente-mobile/Vector-30.png"
              alt=""
              width={20}
              height={17}
              aria-hidden
            />
          </button>
          <h1>Dependentes</h1>
        </div>
      </div>

      {/* ── Panel ── */}
      <div className="cm-panel" style={{ overflowY: "auto" }}>
        {deps.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cliente-mobile/Vector-29.png"
              alt=""
              style={{ width: 48, height: 48, opacity: 0.25, marginBottom: 16 }}
              aria-hidden
            />
            <p style={{ fontSize: 15, color: "var(--cm-gray-400)", margin: 0 }}>
              Nenhum dependente vinculado ao seu plano.
            </p>
          </div>
        ) : (
          <>
            <p className="cm-section-title" style={{ marginBottom: 16 }}>
              {deps.length} {deps.length === 1 ? "dependente" : "dependentes"}{" "}
              vinculado
              {deps.length !== 1 ? "s" : ""} ao plano
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              {deps.map((dep) => {
                const age = dep.dataNascimento
                  ? getAge(dep.dataNascimento)
                  : null;
                return (
                  <div
                    key={dep.id}
                    style={{
                      borderRadius: 20,
                      background: "#F7FAF5",
                      border: "1px solid #E0E8DC",
                      padding: "18px 22px",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 17,
                        fontWeight: 700,
                        color: "#535353",
                      }}
                    >
                      {dep.nome}
                    </p>

                    {dep.tipo && (
                      <span
                        style={{
                          marginTop: 6,
                          width: "fit-content",
                          height: 24,
                          padding: "0 12px",
                          borderRadius: 40,
                          border: "1px solid #BFF08E",
                          background: "#E3FEC8",
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#658D3E",
                          gap: 5,
                          textTransform: "capitalize",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/cliente-mobile/Vector-37.png"
                          alt=""
                          style={{ width: 11, height: 11 }}
                          aria-hidden
                        />
                        {dep.tipo}
                      </span>
                    )}

                    {age !== null && (
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 13,
                          color: "#535353",
                        }}
                      >
                        Idade: {age} anos
                      </p>
                    )}

                    {dep.dataNascimento && (
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 13,
                          color: "#535353",
                        }}
                      >
                        Nasc.: {formatDate(dep.dataNascimento)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Info box */}
        <div
          style={{
            marginTop: 24,
            borderRadius: 20,
            background: "#F3FFE6",
            border: "1px solid #D3FFA3",
            padding: "16px 18px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: "#4A4A4A",
            }}
          >
            Sobre os dependentes do plano
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 12,
              lineHeight: "18px",
              color: "#505D3A",
            }}
          >
            Dependentes diretos: cônjuge, filhos, enteados, netos, pais e sogros
            — incluídos na grade familiar. Dependentes indiretos têm custo
            adicional por pessoa.
          </p>
        </div>
      </div>
    </div>
  );
}
