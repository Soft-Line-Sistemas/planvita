"use client";

import Image from "next/image";
import type { ClientePlano } from "@/types/ClientePlano";

type Props = {
  cliente: ClientePlano;
  onBack: () => void;
};

function formatBirthDate(isoDate?: string | null) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function getAgeFromBirthDate(isoDate?: string | null) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
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
              src="/cliente-mobile/Vector-30.svg"
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
              src="/cliente-mobile/Vector-29.svg"
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
                const parentesco = dep.parentesco ?? dep.tipo ?? "—";
                const idadeCalculada = getAgeFromBirthDate(dep.dataNascimento);
                const idade =
                  typeof dep.idade === "number" ? dep.idade : idadeCalculada;
                const carencia =
                  typeof dep.carenciaRestante === "number"
                    ? dep.carenciaRestante
                    : typeof dep.carenciaDias === "number"
                      ? dep.carenciaDias
                      : null;
                const emCarencia = carencia != null && carencia > 0;
                return (
                  <div
                    key={dep.id}
                    style={{
                      borderRadius: 20,
                      background: "#F4F4F4",
                      border: "1px solid #E9E9E9",
                      padding: "18px 22px",
                      display: "grid",
                      gap: 2,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#535353",
                        lineHeight: "24px",
                      }}
                    >
                      {dep.nome}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#535353",
                        lineHeight: "20px",
                      }}
                    >
                      Parentesco: {parentesco}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#535353",
                        lineHeight: "20px",
                      }}
                    >
                      Idade: {idade != null ? `${idade} anos` : "—"}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#535353",
                        lineHeight: "20px",
                      }}
                    >
                      Data Nascimento: {formatBirthDate(dep.dataNascimento)}
                    </p>
                    {emCarencia ? (
                      <span
                        style={{
                          marginTop: 6,
                          gap: 8,
                          width: "fit-content",
                          height: 24,
                          padding: "0 12px",
                          borderRadius: 40,
                          border: "1px solid #E7CF97",
                          background: "#FFEFCD",
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9F7A2E",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/cliente-mobile/Vector-38.svg"
                          alt=""
                          style={{ width: 11, height: 11, flexShrink: 0 }}
                          aria-hidden
                        />
                        Carência: {carencia} dias
                      </span>
                    ) : dep.valorAdicionalMensal &&
                      dep.valorAdicionalMensal > 0 ? (
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
                        }}
                      >
                        Adicional:{" "}
                        {dep.valorAdicionalMensal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    ) : (
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
                        }}
                      >
                        Coberto
                      </span>
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
