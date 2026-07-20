"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
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
  emerald400: "#66C827",
  emerald500: "#56AF1F",
  emerald600: "#439310",
  slate900: "#0F172A",
  slate700: "#334155",
  slate500: "#64748B",
  slate400: "#94A3B8",
  emeraldBorder70: "rgba(67,147,16,0.30)",
  emerald50_60: "rgba(236,253,245,0.60)",
  emerald50_80: "rgba(236,253,245,0.80)",
  emerald500_20: "rgba(171,240,12,0.90)",
};

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatCpfMasked(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return cpf;
}

function getLeftLogoByTenant(tenantSlug?: string | null): string | null {
  const tenant = (tenantSlug ?? "").trim().toLowerCase();
  if (tenant === "lider") return "/cliente-mobile/lider.avif";
  if (tenant === "bosque") return null;
  return "/cliente-mobile/image 6.png";
}

function svgDataUrl(svg: string) {
  const bytes = new TextEncoder().encode(svg);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `data:image/svg+xml;base64,${window.btoa(binary)}`;
}

export default function CarteirinhaAsImage({
  cliente,
  isFlipped,
  setIsFlipped,
  formatDate,
  formatCurrency,
}: Props) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [cardWidthPx, setCardWidthPx] = useState<number | null>(null);
  const cardWrapRef = useRef<HTMLDivElement | null>(null);
  const tenantSlug = (cliente.tenantSlug ?? "").trim().toLowerCase();
  const leftLogoSrc = getLeftLogoByTenant(tenantSlug);
  const isLiderTenant = tenantSlug === "lider";

  const frontSvg = useMemo(() => {
    const nome = esc(cliente.nome);
    const cpf = esc(formatCpfMasked(cliente.cpf));
    const planoNome = esc(cliente.plano.nome);
    const vigFim = esc(
      cliente.plano.vigencia?.fim
        ? formatDate(cliente.plano.vigencia.fim)
        : "—",
    );
    const numero = esc(
      cliente.numeroCarteirinha || cliente.plano.codigo || "—",
    );

    const html = `
      <div style="width:${WIDTH}px;height:${HEIGHT}px;position:relative;
        font: normal 400 14px Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica Neue,Arial;
        color:${COLORS.white};
      ">
        <div style="
          position:absolute;inset:0;border-radius:26px;padding:34px 30px 58px 30px;box-sizing:border-box;
          background: linear-gradient(232.74deg, ${COLORS.emerald400} 31.11%, ${COLORS.emerald500} 46%, ${COLORS.emerald600} 60%);
          box-shadow: 0 25px 50px rgba(0,0,0,.25);
          display:flex;flex-direction:column;justify-content:space-between;gap:0;
        ">

          <div style="position:relative;z-index:1;max-width:63%;">
            <span style="
              display:inline-flex;align-items:center;border:1px solid rgba(17,17,17,0.45);border-radius:999px;
              padding:6px 14px;color:#111111;font-size:14px;font-weight:600;margin-bottom:18px;
            ">${numero}</span>
            <p style="margin:0 0 12px 0;font-size:28px;line-height:1.15;font-weight:700;color:#111111;word-break:break-word;">${nome}</p>
            <p style="margin:0;color:#111111;font-size:16px;line-height:1.65;">CPF: ${cpf}</p>
            <div style="width:100%;border-top:.75px solid #71D531;margin:10px 0;"></div>
            <p style="margin:0;color:#111111;font-size:16px;line-height:1.65;">Vigência ${vigFim}</p>
          </div>

          <div style="position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:10px;max-width:63%;">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <span style="
                display:inline-flex;align-items:center;background:rgba(171,240,12,1);border-radius:22px;
                padding:6px 14px;color:#1E5A14;font-size:16px;font-weight:700;
              ">Plano: <strong style="margin-left:4px;">${planoNome}</strong></span>
              <span style="font-size:13px;letter-spacing:.3px;color:#111111;">Agora você faz parte da rede Campo do Bosque</span>
            </div>
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
    return svg;
  }, [cliente, formatDate]);
  const frontSrc = useMemo(() => svgDataUrl(frontSvg), [frontSvg]);

  const backSvg = useMemo(() => {
    const coberturaLis = cliente.plano.cobertura
      .map((item) => {
        const t = esc(item);
        return `
          <li style="display:flex;gap:8px;align-items:flex-start;min-width:0;
              border:1px solid ${COLORS.emeraldBorder70};
              background:${COLORS.emerald50_60};
              border-radius:12px;padding:6px 10px;">
            <span style="width:6px;height:6px;border-radius:9999px;background:${COLORS.emerald500};margin-top:4px;flex-shrink:0;"></span>
            <span style="font-size:12px;line-height:1.15;word-break:break-word;overflow-wrap:anywhere;color:${COLORS.slate700}">${t}</span>
          </li>
        `;
      })
      .join("");

    const obs = cliente.plano.observacoes
      ? `<p style="margin:0;color:${COLORS.slate500};font-size:12px">${esc(cliente.plano.observacoes)}</p>`
      : "";

    const status = esc(cliente.plano.status);
    const valorBase = Number(cliente.plano.valorMensal ?? 0);
    const valorAdicionalDependentes = (cliente.dependentes ?? []).reduce(
      (acc, dep) => acc + Number(dep.valorAdicionalMensal ?? 0),
      0,
    );
    const valorAdicional = Number(
      cliente.plano.valorAdicionalMensal ?? valorAdicionalDependentes,
    );
    const valorTotal = Number(
      cliente.plano.valorTotalMensal ?? valorBase + valorAdicional,
    );
    const valorTotalFmt = esc(formatCurrency(valorTotal));

    const html = `
      <div style="width:${WIDTH}px;height:${HEIGHT}px;position:relative;
        font: normal 400 14px Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica Neue,Arial;
        color:${COLORS.slate700};
      ">
        <div style="
          position:absolute;inset:0;border-radius:26px;padding:30px;box-sizing:border-box;
          background: linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.emerald50} 50%, ${COLORS.white} 100%);
          box-shadow: 0 25px 50px rgba(0,0,0,.25);
          display:flex;flex-direction:column;gap:0;justify-content:space-between;
        ">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h2 style="margin:0;font-size:24px;font-weight:700;color:${COLORS.slate900}">Coberturas e Benefícios</h2>
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:${COLORS.slate400}">PLANVITA</span>
          </div>

          <ul style="margin:16px 0 0 0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${coberturaLis}
          </ul>

          <div style="
            margin-top:16px;display:flex;flex-direction:column;gap:10px;border-radius:16px;padding:14px;
            border:1px solid ${COLORS.emeraldBorder70};
            background:${COLORS.emerald50_80};color:${COLORS.slate700};
          ">
            <p style="margin:0;line-height:1.25;"><strong>Contato: </strong><span style="word-break:break-word;">${esc(cliente.email)}</span></p>
            <p style="margin:0;line-height:1.25;"><strong>Telefone: </strong><span style="word-break:break-word;">${esc(cliente.telefone)}</span></p>
            <p style="margin:0;line-height:1.25;"><strong>Valor mensal: </strong>${valorTotalFmt}</p>
            <p style="margin:0;line-height:1.25;"><strong>Status: </strong><span style="text-transform:capitalize;">${status}</span></p>
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
    return svg;
  }, [cliente, formatCurrency]);
  const backSrc = useMemo(() => svgDataUrl(backSvg), [backSvg]);

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

  useEffect(() => {
    const updateCardWidth = () => {
      const viewportWidth =
        window.visualViewport?.width && window.visualViewport.width > 0
          ? window.visualViewport.width
          : window.innerWidth;
      const nextWidth = Math.min(640, Math.max(280, viewportWidth - 16));
      setCardWidthPx(nextWidth);
    };

    updateCardWidth();
    window.addEventListener("resize", updateCardWidth);
    window.addEventListener("orientationchange", updateCardWidth);
    window.visualViewport?.addEventListener("resize", updateCardWidth);

    return () => {
      window.removeEventListener("resize", updateCardWidth);
      window.removeEventListener("orientationchange", updateCardWidth);
      window.visualViewport?.removeEventListener("resize", updateCardWidth);
    };
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

  const rasterizeFrontWithOverlays = useCallback(
    async (baseSvg: string, width: number, height: number) => {
      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas não suportado");

      const baseImg = await loadImage(svgDataUrl(baseSvg));
      ctx.drawImage(baseImg, 0, 0, width, height);

      const drawFromRightBottom = (
        img: HTMLImageElement,
        drawWidth: number,
        rightPct: number,
        bottomPct: number,
        rotateDeg = 0,
        opacity = 1,
      ) => {
        const drawHeight = drawWidth * (img.naturalHeight / img.naturalWidth);
        const x = width - width * (rightPct / 100) - drawWidth;
        const y = height - height * (bottomPct / 100) - drawHeight;
        ctx.save();
        ctx.globalAlpha = opacity;
        if (rotateDeg !== 0) {
          ctx.translate(x + drawWidth / 2, y + drawHeight / 2);
          ctx.rotate((rotateDeg * Math.PI) / 180);
          ctx.drawImage(
            img,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight,
          );
        } else {
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        }
        ctx.restore();
      };

      const drawFromRightTop = (
        img: HTMLImageElement,
        drawWidth: number,
        rightPct: number,
        topPct: number,
        rotateDeg = 0,
      ) => {
        const drawHeight = drawWidth * (img.naturalHeight / img.naturalWidth);
        const x = width - width * (rightPct / 100) - drawWidth;
        const y = height * (topPct / 100);
        ctx.save();
        if (rotateDeg !== 0) {
          ctx.translate(x + drawWidth / 2, y + drawHeight / 2);
          ctx.rotate((rotateDeg * Math.PI) / 180);
          ctx.drawImage(
            img,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight,
          );
        } else {
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        }
        ctx.restore();
      };

      const ornament = await loadImage("/cliente-mobile/icon-8-1-2x.png");
      drawFromRightBottom(ornament, width * 0.566, -17.8, -40.1, 0, 0.2);

      const topRight = await loadImage("/cliente-mobile/Camada 3.png");
      drawFromRightTop(topRight, width * 0.115, 12.2, -11.8, -90);

      if (leftLogoSrc) {
        const lower = await loadImage(leftLogoSrc);
        if (isLiderTenant) {
          drawFromRightBottom(lower, width * 0.245, 9.2, 8.5, 0);
        } else {
          drawFromRightBottom(lower, width * 0.048, 9.2, 3.8, -90);
        }
      }

      return canvas.toDataURL("image/png");
    },
    [isLiderTenant, leftLogoSrc],
  );

  const rasterizeBackWithBackgroundIcon = useCallback(
    async (baseSvg: string, width: number, height: number) => {
      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas não suportado");

      const baseImg = await loadImage(svgDataUrl(baseSvg));
      ctx.drawImage(baseImg, 0, 0, width, height);

      const ornament = await loadImage("/cliente-mobile/icon-8-1-2x.png");
      const ornamentW = width * 0.566;
      const ornamentH =
        ornamentW * (ornament.naturalHeight / ornament.naturalWidth);
      const x = width - width * (-17.8 / 100) - ornamentW;
      const y = height - height * (-40.1 / 100) - ornamentH;
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.drawImage(ornament, x, y, ornamentW, ornamentH);
      ctx.restore();

      return canvas.toDataURL("image/png");
    },
    [],
  );

  function stripShadowFromSvg(svg: string) {
    return svg.replace(/box-shadow:[^;"]*;?/g, "");
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

      const frontClean = stripShadowFromSvg(frontSvg);
      const backClean = stripShadowFromSvg(backSvg);

      const targetW = Math.round(WIDTH * PRINT_SCALE);
      const targetH = Math.round(HEIGHT * PRINT_SCALE);

      const [frontPng, backPng] = await Promise.all([
        rasterizeFrontWithOverlays(frontClean, targetW, targetH),
        rasterizeBackWithBackgroundIcon(backClean, targetW, targetH),
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
  }, [
    cliente.numeroCarteirinha,
    frontSvg,
    backSvg,
    rasterizeFrontWithOverlays,
    rasterizeBackWithBackgroundIcon,
    svgToPngDataUrl,
  ]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={cardWrapRef}
        className="relative select-none"
        style={{
          width: cardWidthPx ? `${cardWidthPx}px` : "calc(100vw - 16px)",
          maxWidth: "640px",
          aspectRatio: `${WIDTH} / ${HEIGHT}`,
          perspective: "1200px",
          WebkitPerspective: "1200px",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="absolute inset-0 [transform-style:preserve-3d] transform-gpu will-change-transform"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 450ms cubic-bezier(.2,.8,.2,1)",
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
          }}
        >
          <div
            className="absolute inset-0 [transform-style:preserve-3d] transform-gpu will-change-transform"
            style={{
              transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
              transition: "transform 700ms cubic-bezier(.2,.8,.2,1)",
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute inset-0 rounded-[0.75rem] overflow-hidden shadow-2xl [backface-visibility:hidden]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <img
                key={frontSrc.length}
                src={frontSrc}
                alt="Carteirinha - frente"
                className="w-full h-full object-cover"
                draggable={false}
                loading="eager"
              />
              {!isFlipped && (
                <>
                  <img
                    src="/cliente-mobile/icon-8-1-2x.png"
                    alt=""
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                      right: "-17.8%",
                      bottom: "-40.1%",
                      width: "56.6%",
                      height: "auto",
                      opacity: 0.2,
                      zIndex: 3,
                    }}
                  />
                  <img
                    src="/cliente-mobile/Camada 3.png"
                    alt=""
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                      right: "12.2%",
                      top: "-11.8%",
                      width: "11.5%",
                      transform: "rotate(-90deg)",
                      transformOrigin: "center",
                      height: "auto",
                      zIndex: 4,
                    }}
                  />
                  {leftLogoSrc ? (
                    <img
                      src={leftLogoSrc}
                      alt=""
                      aria-hidden
                      className="absolute pointer-events-none"
                      style={
                        isLiderTenant
                          ? {
                              width: "24.5%",
                              right: "9.2%",
                              bottom: "8.5%",
                              height: "auto",
                              zIndex: 4,
                            }
                          : {
                              width: "4.8%",
                              right: "9.2%",
                              bottom: "3.8%",
                              transform: "rotate(-90deg)",
                              transformOrigin: "center",
                              height: "auto",
                              zIndex: 4,
                            }
                      }
                    />
                  ) : null}
                </>
              )}
            </div>

            <div
              className="absolute inset-0 rounded-[0.75rem] overflow-hidden shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <img
                key={backSrc.length}
                src={backSrc}
                alt="Carteirinha - verso"
                className="w-full h-full object-cover"
                draggable={false}
                loading="eager"
              />
              {isFlipped && (
                <img
                  src="/cliente-mobile/icon-8-1-2x.png"
                  alt=""
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    right: "-17.8%",
                    bottom: "-40.1%",
                    width: "56.6%",
                    height: "auto",
                    opacity: 0.2,
                    zIndex: 3,
                  }}
                />
              )}
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
