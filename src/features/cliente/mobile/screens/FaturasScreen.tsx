"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Loader2, CheckCircle, Copy, ExternalLink, X } from "lucide-react";
import type { ContaFinanceira } from "@/services/financeiro/contasCliente.service";

type Props = {
  contas: ContaFinanceira[];
  isLoading: boolean;
  errorMessage?: string | null;
  onBack: () => void;
  mostrarHistoricoCompleto: boolean;
  onHistoricoCompletoChange: (enabled: boolean) => void;
};

type FilterStatus = "todos" | "pendente" | "pago" | "vencido";
type FilterPeriodo = "todos" | "30" | "60" | "90" | "ano" | "historico";

type PixModal = {
  descricao: string;
  valor: number;
  vencimento: string;
  codigo: string;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateLong(isoDate: string) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getReferenciaMensalAnterior(isoDate: string) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "Mês/ano indisponível";
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString("pt-BR", {
    month: "2-digit",
    year: "numeric",
  });
}

function isCobrancaRecorrente(conta: ContaFinanceira) {
  const descricao = String(conta.descricao ?? "").toLowerCase();
  return (
    Boolean(conta.asaasSubscriptionId) || descricao.includes("mensalidade")
  );
}

function getFaturaTitulo(conta: ContaFinanceira) {
  if (!isCobrancaRecorrente(conta)) return conta.descricao;
  const referencia = getReferenciaMensalAnterior(conta.vencimento);
  return `Mensalidade referente a ${referencia}`;
}

function getStatusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "PAGO" || s === "RECEBIDO") return "pago";
  if (s === "PENDENTE") return "atual";
  return "vencido";
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === "PAGO" || s === "RECEBIDO")
    return <span className="status-badge pago">✓ Pago</span>;
  if (s === "PENDENTE")
    return (
      <span className="status-badge atual">
        <Image
          src="/cliente-mobile/Vector-42.png"
          alt=""
          width={12}
          height={12}
          aria-hidden
        />
        Atual
      </span>
    );
  return (
    <span className="status-badge vencido">
      <Image
        src="/cliente-mobile/Vector-41.png"
        alt=""
        width={12}
        height={12}
        aria-hidden
      />
      Vencido
    </span>
  );
}

function getPixQrSrc(codigo: string) {
  if (!codigo) return "";
  if (codigo.startsWith("data:image/")) return codigo;
  if (/^https?:\/\//i.test(codigo)) return codigo;
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(codigo)}`;
}

function PixSheet({ pix, onClose }: { pix: PixModal; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pix.codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full rounded-t-3xl px-5 pt-5 pb-8 max-h-[90dvh] overflow-y-auto"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Pagamento via PIX</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm mb-4 space-y-0.5">
          <p className="font-semibold text-slate-800">{pix.descricao}</p>
          <p className="text-slate-600">Valor: {formatCurrency(pix.valor)}</p>
          <p className="text-slate-600">
            Vencimento: {formatDate(pix.vencimento)}
          </p>
        </div>
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPixQrSrc(pix.codigo)}
            alt="QR Code PIX"
            className="w-52 h-52 object-contain rounded-xl border border-slate-100"
          />
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1 font-medium">
            Código PIX (copia e cola)
          </p>
          <p className="text-xs break-all text-slate-700 select-all">
            {pix.codigo}
          </p>
        </div>
        <button
          type="button"
          className="cm-btn-solid mb-2"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckCircle size={18} /> Copiado!
            </>
          ) : (
            <>
              <Copy size={18} /> Copiar código PIX
            </>
          )}
        </button>
        {pix.codigo.startsWith("http") && (
          <button
            type="button"
            className="cm-btn-outline"
            onClick={() => window.open(pix.codigo, "_blank")}
          >
            <ExternalLink size={16} />
            Abrir link
          </button>
        )}
      </div>
    </div>
  );
}

export default function FaturasScreen({
  contas,
  isLoading,
  errorMessage,
  onBack,
  mostrarHistoricoCompleto,
  onHistoricoCompletoChange,
}: Props) {
  const [filtroStatus, setFiltroStatus] = useState<FilterStatus>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<FilterPeriodo>(
    mostrarHistoricoCompleto ? "historico" : "todos",
  );
  const [pixModal, setPixModal] = useState<PixModal | null>(null);
  const [copiado, setCopiado] = useState<number | null>(null);

  const filtradas = useMemo(() => {
    const sorted = [...contas].sort(
      (a, b) =>
        new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime(),
    );

    const agora = new Date();
    const inicioAno = new Date(agora.getFullYear(), 0, 1);
    const limite30 = new Date();
    limite30.setDate(agora.getDate() - 30);
    const limite60 = new Date();
    limite60.setDate(agora.getDate() - 60);
    const limite90 = new Date();
    limite90.setDate(agora.getDate() - 90);

    return sorted.filter((c) => {
      const v = new Date(c.vencimento);
      if (filtroPeriodo !== "todos") {
        if (isNaN(v.getTime())) return false;
        if (filtroPeriodo === "30" && v < limite30) return false;
        if (filtroPeriodo === "60" && v < limite60) return false;
        if (filtroPeriodo === "90" && v < limite90) return false;
        if (filtroPeriodo === "ano" && v < inicioAno) return false;
      }
      if (filtroStatus === "todos") return true;
      const s = c.status.toUpperCase();
      if (filtroStatus === "pago")
        return s === "PAGO" || s === "RECEBIDO" || s === "CONFIRMADO";
      if (filtroStatus === "pendente") return s === "PENDENTE";
      if (filtroStatus === "vencido")
        return s === "VENCIDO" || s === "ATRASADO";
      return true;
    });
  }, [contas, filtroStatus, filtroPeriodo]);

  const emAberto = contas.filter((c) => {
    const s = c.status.toUpperCase();
    return s === "PENDENTE" || s === "VENCIDO" || s === "ATRASADO";
  }).length;

  const copiarPix = async (conta: ContaFinanceira) => {
    if (!conta.pixQrCode) return;
    try {
      await navigator.clipboard.writeText(conta.pixQrCode);
      setCopiado(conta.id);
      setTimeout(() => setCopiado(null), 2500);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {pixModal && (
        <PixSheet pix={pixModal} onClose={() => setPixModal(null)} />
      )}

      <div
        id="screen-faturas"
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
            <h1>Minhas faturas</h1>
          </div>
        </div>

        {/* White panel */}
        <div
          className="cm-panel"
          style={{ padding: 0, borderRadius: "20px 20px 0 0", marginTop: 3 }}
        >
          {/* Filter */}
          <div className="cm-faturas-filter">
            <div className="cm-filter-label">
              <Image
                src="/cliente-mobile/Vector-19.png"
                alt=""
                width={14}
                height={14}
                aria-hidden
              />
              <span>Filtro</span>
            </div>
            <div className="cm-filter-row">
              <div className="cm-select-wrap">
                <select
                  aria-label="Filtrar por período"
                  value={filtroPeriodo}
                  onChange={(e) => {
                    const value = e.target.value as FilterPeriodo;
                    setFiltroPeriodo(value);
                    onHistoricoCompletoChange(value === "historico");
                  }}
                >
                  <option value="todos">Todo o período</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="60">Últimos 60 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="ano">Este ano</option>
                  <option value="historico">Histórico completo</option>
                </select>
                <Image
                  src="/cliente-mobile/Vector-31.png"
                  alt=""
                  width={12}
                  height={8}
                  className="cm-select-chev"
                  aria-hidden
                />
              </div>
              <div className="cm-select-wrap">
                <select
                  aria-label="Filtrar por status"
                  value={filtroStatus}
                  onChange={(e) =>
                    setFiltroStatus(e.target.value as FilterStatus)
                  }
                >
                  <option value="todos">Todos os status</option>
                  <option value="pendente">Em aberto</option>
                  <option value="pago">Pago</option>
                  <option value="vencido">Vencido</option>
                </select>
                <Image
                  src="/cliente-mobile/Vector-31.png"
                  alt=""
                  width={12}
                  height={8}
                  className="cm-select-chev"
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {emAberto > 0 && (
            <div className="cm-faturas-count">
              <span>
                {emAberto} fatura{emAberto !== 1 ? "s" : ""} em aberto
              </span>
              <Image
                src="/cliente-mobile/Vector-43.png"
                alt=""
                width={12}
                height={12}
                className="cm-select-chev"
                aria-hidden
              />
            </div>
          )}

          {/* List */}
          {errorMessage ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 16px",
                gap: 10,
                color: "var(--cm-red)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 14, margin: 0 }}>
                Falha ao carregar faturas.
              </p>
              <p
                style={{ fontSize: 12, color: "var(--cm-gray-600)", margin: 0 }}
              >
                {errorMessage}
              </p>
            </div>
          ) : isLoading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "64px 16px",
                gap: 12,
                color: "var(--cm-gray-400)",
              }}
            >
              <Loader2 size={32} className="cm-spinner" />
              <p style={{ fontSize: 14 }}>Buscando faturas...</p>
            </div>
          ) : filtradas.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "64px 16px",
                gap: 12,
                color: "var(--cm-gray-400)",
                textAlign: "center",
              }}
            >
              <CheckCircle size={40} style={{ color: "var(--cm-gray-200)" }} />
              <p style={{ fontSize: 14 }}>
                {filtroStatus === "todos"
                  ? "Nenhuma fatura encontrada."
                  : "Nenhuma fatura com este filtro."}
              </p>
            </div>
          ) : (
            <div className="cm-faturas-list">
              {filtradas.map((conta) => {
                const statusKey = getStatusClass(conta.status);
                const isPendenteOuAtrasado =
                  conta.status.toUpperCase() === "PENDENTE" ||
                  conta.status.toUpperCase() === "ATRASADO" ||
                  conta.status.toUpperCase() === "VENCIDO";

                return (
                  <div
                    key={conta.id}
                    className={`fatura-card ${statusKey} cm-fade-up`}
                  >
                    <div className="fatura-body">
                      <p className="fatura-title">{getFaturaTitulo(conta)}</p>
                      <div className="fatura-due">
                        <strong>Vencimento</strong>
                        <br />
                        {formatDateLong(conta.vencimento)}
                      </div>
                      <div className="fatura-row">
                        <span className="fatura-value">
                          {formatCurrency(conta.valor)}
                        </span>
                        <StatusBadge status={conta.status} />
                      </div>
                    </div>

                    <div className="fatura-actions">
                      {conta.paymentUrl ? (
                        <button
                          type="button"
                          className={
                            isPendenteOuAtrasado ? "btn-pagar" : "btn-recibo"
                          }
                          onClick={() =>
                            window.open(conta.paymentUrl!, "_blank")
                          }
                        >
                          {isPendenteOuAtrasado ? (
                            "PAGAR"
                          ) : (
                            <>
                              <Image
                                src="/cliente-mobile/Vector-18.png"
                                alt=""
                                width={16}
                                height={16}
                                aria-hidden
                              />
                              <span>Ver recibo</span>
                            </>
                          )}
                        </button>
                      ) : null}

                      {conta.pixQrCode ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: conta.paymentUrl ? 8 : 0,
                          }}
                        >
                          <button
                            type="button"
                            className="cm-btn-outline"
                            style={{ height: 44, flex: 1 }}
                            onClick={() =>
                              setPixModal({
                                descricao: getFaturaTitulo(conta),
                                valor: conta.valor,
                                vencimento: conta.vencimento,
                                codigo: conta.pixQrCode!,
                              })
                            }
                          >
                            Ver QR Code PIX
                          </button>
                          <button
                            type="button"
                            className="cm-btn-outline"
                            style={{
                              height: 44,
                              width: 44,
                              padding: 0,
                              flexShrink: 0,
                            }}
                            onClick={() => copiarPix(conta)}
                          >
                            {copiado === conta.id ? (
                              <CheckCircle size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      ) : null}

                      {!conta.paymentUrl && !conta.pixQrCode ? (
                        <span
                          style={{ fontSize: 12, color: "var(--cm-gray-400)" }}
                        >
                          Indisponível
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
