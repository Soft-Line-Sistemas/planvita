"use client";

import { useMemo, useCallback, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import type { ClientePlano } from "@/types/ClientePlano";

type Props = {
  cliente: ClientePlano;
  isFlipped: boolean;
  setIsFlipped: (v: boolean | ((p: boolean) => boolean)) => void;
  formatDate: (d: string) => string;
  formatCurrency: (n: number) => string;
};

const WIDTH = 672;
const HEIGHT = 424;

const CARD_MM_W = 85.6;
const CARD_MM_H = 53.98;

const PRINT_SCALE = 2;

const MAX_TILT_X = 10;
const MAX_TILT_Y = 16;

const COLORS = {
  white: "#FFFFFF",
  emerald50: "#ECFDF5",
  emerald100: "#D1FAE5",
  emerald200: "#A7F3D0",
  emerald400: "#34D399",
  emerald500: "#10B981",
  emerald600: "#059669",
  slate900: "#0F172A",
  slate700: "#334155",
  slate500: "#64748B",
  slate400: "#94A3B8",
  emeraldBorder70: "rgba(16,185,129,0.70)",
  emerald50_60: "rgba(236,253,245,0.60)",
  emerald50_80: "rgba(236,253,245,0.80)",
  emerald500_20: "rgba(16,185,129,0.20)",
  yellow400_20: "rgba(250, 204, 21, 0.20)",
  slate500_40: "rgba(100, 116, 139, 0.40)",
};

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function CarteirinhaAsImage({
  cliente,
  isFlipped,
  setIsFlipped,
  formatDate,
  formatCurrency,
}: Props) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardWrapRef = useRef<HTMLDivElement | null>(null);
  const frontSrc = useMemo(() => {
    const nome = esc(cliente.nome.toUpperCase());
    const cpf = esc(cliente.cpf);
    const codigo = esc(cliente.plano.codigo);
    const planoNome = esc(cliente.plano.nome);
    const vigIni = esc(formatDate(cliente.plano.vigencia.inicio));
    const vigFim = esc(formatDate(cliente.plano.vigencia.fim));
    const valor = esc(formatCurrency(cliente.plano.valorMensal));
    const status = esc(cliente.plano.status);
    const numero = esc(cliente.numeroCarteirinha);

    const html = `
      <div style="width:${WIDTH}px;height:${HEIGHT}px;position:relative;
        font: normal 400 14px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica Neue,Arial;
        color:${COLORS.white};
      ">
        <div style="
          position:absolute;inset:0;border-radius:17px;padding:28px;box-sizing:border-box;
          background: linear-gradient(135deg, ${COLORS.emerald400} 0%, ${COLORS.emerald500} 50%, ${COLORS.emerald600} 100%);
          box-shadow: 0 25px 50px rgba(0,0,0,.25);
          display:flex;flex-direction:column;gap:0;
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;
              text-transform:uppercase;letter-spacing:.3em;font-weight:600;font-size:14px;">
            <span>Planvita</span><span>${codigo}</span>
          </div>

          <div style="margin-top:40px;display:flex;flex-direction:column;gap:16px;">
            <div>
              <p style="margin:0;color:${COLORS.emerald200};text-transform:uppercase;font-size:12px">Titular</p>
              <p style="margin:4px 0 0 0;font-size:18px;font-weight:700;word-break:break-word;">${nome}</p>
            </div>

            <div>
              <p style="margin:0;color:${COLORS.emerald200};text-transform:uppercase;font-size:12px">CPF</p>
              <p style="margin:4px 0 0 0;font-size:14px;letter-spacing:.05em;word-break:break-word;">${cpf}</p>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:14px;">
              <div>
                <p style="margin:0;color:${COLORS.emerald200};text-transform:uppercase;font-size:12px">Plano</p>
                <p style="margin:4px 0 0 0;font-weight:700;word-break:break-word;">${planoNome}</p>
              </div>
              <div>
                <p style="margin:0;color:${COLORS.emerald200};text-transform:uppercase;font-size:12px">Vigência</p>
                <p style="margin:4px 0 0 0;font-weight:700">${vigIni}</p>
                <p style="margin:2px 0 0 0;color:${COLORS.emerald100};font-size:12px">até ${vigFim}</p>
              </div>
            </div>
          </div>

          <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:14px;">
            <div style="display:flex;flex-direction:column">
              <span style="color:${COLORS.emerald200};text-transform:uppercase;font-size:12px;">Valor mensal</span>
              <span style="font-weight:700;font-size:18px">${valor}</span>
            </div>
            <span style="
              border-radius:9999px;padding:6px 12px;font-size:12px;font-weight:700;text-transform:capitalize;
              background:${cliente.plano.status === "ativo" ? COLORS.emerald500_20 : cliente.plano.status === "suspenso" ? COLORS.yellow400_20 : COLORS.slate500_40};
              color:${COLORS.white};
              white-space:nowrap;
            ">${status}</span>
          </div>

          <p style="margin:24px 0 0 0;color:${COLORS.emerald200};font-size:12px;letter-spacing:.3em;">
            Carteirinha ${numero}
          </p>
        </div>
      </div>
    `;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
        </foreignObject>
      </svg>
    `;
    return svgDataUrl(svg);
  }, [cliente, formatCurrency, formatDate]);

  const backSrc = useMemo(() => {
    const coberturaLis = cliente.plano.cobertura
      .map((item) => {
        const t = esc(item);
        return `
          <li style="display:flex;gap:8px;align-items:flex-start;min-width:0;
              border:1px solid ${COLORS.emeraldBorder70};
              background:${COLORS.emerald50_60};
              border-radius:12px;padding:8px 12px;">
            <span style="width:6px;height:6px;border-radius:9999px;background:${COLORS.emerald500};margin-top:4px;flex-shrink:0;"></span>
            <span style="line-height:1.2;word-break:break-word;color:${COLORS.slate700}">${t}</span>
          </li>
        `;
      })
      .join("");

    const obs = cliente.plano.observacoes
      ? `<p style="margin:0;color:${COLORS.slate500};font-size:12px">${esc(cliente.plano.observacoes)}</p>`
      : "";

    const html = `
      <div style="width:${WIDTH}px;height:${HEIGHT}px;position:relative;
        font: normal 400 14px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica Neue,Arial;
        color:${COLORS.slate700};
      ">
        <div style="
          position:absolute;inset:0;border-radius:17px;padding:28px;box-sizing:border-box;
          background: linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.emerald50} 50%, ${COLORS.white} 100%);
          box-shadow: 0 25px 50px rgba(0,0,0,.25);
          display:flex;flex-direction:column;gap:0;
        ">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h2 style="margin:0;font-size:18px;font-weight:700;color:${COLORS.slate900}">Benefícios do plano</h2>
            <span style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.3em;color:${COLORS.slate400}">Planvita</span>
          </div>

          <ul style="margin:24px 0 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:12px;">
            ${coberturaLis}
          </ul>

          <div style="
            margin-top:24px;display:flex;flex-direction:column;gap:12px;border-radius:12px;padding:16px;
            border:1px solid ${COLORS.emeraldBorder70};
            background:${COLORS.emerald50_80};color:${COLORS.slate700};
          ">
            <p style="margin:0;line-height:1.25;"><strong>Contato: </strong><span style="word-break:break-word;">${esc(cliente.email)}</span></p>
            <p style="margin:0;line-height:1.25;"><strong>Telefone: </strong><span style="word-break:break-word;">${esc(cliente.telefone)}</span></p>
            ${obs}
          </div>
        </div>
      </div>
    `;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
        </foreignObject>
      </svg>
    `;
    return svgDataUrl(svg);
  }, [cliente]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = cardWrapRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1

    const y = (px - 0.5) * 2 * MAX_TILT_Y; // -MAX..MAX
    const x = -(py - 0.5) * 2 * MAX_TILT_X;

    setTilt({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    // volta suave para 0
    setTilt({ x: 0, y: 0 });
  }, []);

  const svgToPngDataUrl = useCallback(
    (svgUrl: string, width = WIDTH, height = HEIGHT) =>
      new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas não suportado"));
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const png = canvas.toDataURL("image/png");
            resolve(png);
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
        img.src = svgUrl;
      }),
    [],
  );

  function stripShadowFromSvgDataUrl(svgDataUrl: string) {
    const prefix = "data:image/svg+xml;charset=utf-8,";
    if (!svgDataUrl.startsWith(prefix)) return svgDataUrl;
    const decoded = decodeURIComponent(svgDataUrl.slice(prefix.length));
    const cleaned = decoded.replace(/box-shadow:[^;"]*;?/g, "");
    return prefix + encodeURIComponent(cleaned);
  }

  const handleDownloadPdf = useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const marginLeft = 10;
      const marginTop = 10;
      const gap = 8;
      const x = marginLeft;
      const y1 = marginTop;
      const y2 = y1 + CARD_MM_H + gap;

      const frontClean = stripShadowFromSvgDataUrl(frontSrc);
      const backClean = stripShadowFromSvgDataUrl(backSrc);

      const targetW = Math.round(WIDTH * PRINT_SCALE);
      const targetH = Math.round(HEIGHT * PRINT_SCALE);

      const [frontPng, backPng] = await Promise.all([
        svgToPngDataUrl(frontClean, targetW, targetH),
        svgToPngDataUrl(backClean, targetW, targetH),
      ]);

      pdf.addImage(
        frontPng,
        "PNG",
        x,
        y1,
        CARD_MM_W,
        CARD_MM_H,
        undefined,
        "FAST",
      );
      pdf.addImage(
        backPng,
        "PNG",
        x,
        y2,
        CARD_MM_W,
        CARD_MM_H,
        undefined,
        "FAST",
      );

      const nomeArquivo = `carteirinha_${cliente.numeroCarteirinha}.pdf`;
      pdf.save(nomeArquivo);
    } catch (err) {
      console.error(err);
      alert("Não foi possível gerar o PDF. Tente novamente.");
    }
  }, [cliente.numeroCarteirinha, frontSrc, backSrc, svgToPngDataUrl]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={cardWrapRef}
        className="relative w-[min(92vw,640px)] aspect-[336/212] select-none"
        style={{ perspective: "1200px" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="absolute inset-0 [transform-style:preserve-3d] transform-gpu will-change-transform"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 450ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <div
            className="absolute inset-0 [transform-style:preserve-3d] transform-gpu will-change-transform"
            style={{
              transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
              transition: "transform 700ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <div className="absolute inset-0 rounded-[0.75rem] overflow-hidden shadow-2xl [backface-visibility:hidden]">
              <Image
                key={frontSrc.length}
                src={frontSrc}
                alt="Carteirinha - frente"
                className="w-full h-full object-cover"
                draggable={false}
                width={WIDTH}
                height={HEIGHT}
              />
            </div>

            <div className="absolute inset-0 rounded-[0.75rem] overflow-hidden shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <Image
                key={backSrc.length}
                src={backSrc}
                alt="Carteirinha - verso"
                className="w-full h-full object-cover"
                draggable={false}
                width={WIDTH}
                height={HEIGHT}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          className="btn btn-primary cursor-pointer"
          onClick={() => setIsFlipped((prev) => !prev)}
        >
          {isFlipped ? "Ver frente" : "Ver verso"}
        </Button>

        <Button
          type="button"
          className="btn btn-accent cursor-pointer hover:text-black hover:border-black hover:border"
          onClick={handleDownloadPdf}
        >
          Baixar PDF
        </Button>
      </div>
    </div>
  );
}
