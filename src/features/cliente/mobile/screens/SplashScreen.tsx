"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  {
    title: "Cuidado para toda a família",
    body: "Conte com o Campo do Bosque para oferecer apoio, segurança e tranquilidade em todos os momentos.",
    bg: "/cliente-mobile/carrossel-1.jpg",
  },
  {
    title: "Sua carteirinha sempre à mão",
    body: "Acesse sua carteirinha digital do Campo do Bosque sempre que precisar, de forma rápida e prática.",
    bg: "/cliente-mobile/carrossel-2.jpg",
  },
  {
    title: "Tudo em um só lugar",
    body: "Consulte faturas, acompanhe dependentes e gerencie seu plano Campo do Bosque com facilidade pelo celular.",
    bg: "/cliente-mobile/carrossel-2.jpg",
  },
] as const;

type Props = {
  onComplete: () => void;
};

const UNIQUE_BG_IMAGES = [...new Set(SLIDES.map((s) => s.bg))];

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<"splash" | "carousel">("splash");
  const [slideIndex, setSlideIndex] = useState(0);

  const goToCarousel = useCallback(() => setPhase("carousel"), []);

  useEffect(() => {
    const links = UNIQUE_BG_IMAGES.map((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
      return link;
    });
    return () => {
      links.forEach((l) => document.head.removeChild(l));
    };
  }, []);

  useEffect(() => {
    if (phase !== "splash") return;
    const t = setTimeout(goToCarousel, 2200);
    return () => clearTimeout(t);
  }, [phase, goToCarousel]);

  if (phase === "splash") {
    return (
      <div
        className="cm-splash-root"
        onClick={goToCarousel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToCarousel();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Continuar"
      >
        <Image
          className="cm-splash-logo"
          src="/cliente-mobile/Camada 1.svg"
          alt="Campo do Bosque"
          width={282}
          height={91}
          priority
        />
        <span className="cm-splash-domain">campodobosque.com.br</span>
      </div>
    );
  }

  const slide = SLIDES[Math.min(slideIndex, SLIDES.length - 1)];
  const isLast = slideIndex >= SLIDES.length - 1;

  return (
    <div className="cm-carousel-root">
      {/* Background images — all rendered, only active one visible */}
      {SLIDES.map((s, i) => (
        <Image
          key={s.bg + i}
          src={s.bg}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          quality={100}
          className="cm-carousel-bg"
          style={{
            objectFit: "cover",
            opacity: i === slideIndex ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
          aria-hidden="true"
        />
      ))}

      {/* Overlay gradient */}
      <div className="cm-carousel-overlay" aria-hidden="true" />

      {/* Logo */}
      <div className="cm-carousel-logo-wrap" />

      {/* Content */}
      <div className="cm-carousel-content">
        <h1 className="cm-carousel-title">{slide.title}</h1>
        <p className="cm-carousel-body">{slide.body}</p>
      </div>

      {/* Dots */}
      <div className="cm-carousel-dots" role="tablist" aria-label="Slides">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`cm-carousel-dot${i === slideIndex ? " active" : ""}`}
            onClick={() => setSlideIndex(i)}
            aria-label={`Slide ${i + 1}`}
            role="tab"
            aria-selected={i === slideIndex}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="cm-carousel-actions">
        <button
          type="button"
          className="cm-carousel-btn-primary"
          onClick={() => {
            if (isLast) {
              window.location.href = "/cliente/cadastro";
              return;
            } else setSlideIndex((n) => n + 1);
          }}
        >
          {isLast ? "Começar agora" : "Próximo"}
        </button>
        <button
          type="button"
          className="cm-carousel-btn-secondary"
          onClick={onComplete}
        >
          Já tenho conta
        </button>
      </div>
    </div>
  );
}
