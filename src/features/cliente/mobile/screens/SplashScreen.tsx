"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  {
    title: "Bem-vindo à Planvita",
    body: "Assistência familiar de qualidade para você e sua família em momentos que mais importam.",
    bg: "/cliente-mobile/carrossel-1.jpg",
  },
  {
    title: "Carteirinha digital",
    body: "Acesse sua carteirinha de qualquer lugar, a qualquer hora, direto pelo aplicativo.",
    bg: "/cliente-mobile/carrossel-2.jpg",
  },
  {
    title: "Gerencie com facilidade",
    body: "Acompanhe faturas, dependentes e muito mais na palma da sua mão.",
    bg: "/cliente-mobile/carrossel-2.jpg",
  },
] as const;

type Props = {
  onComplete: () => void;
};

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<"splash" | "carousel">("splash");
  const [slideIndex, setSlideIndex] = useState(0);

  const goToCarousel = useCallback(() => setPhase("carousel"), []);

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
          src="/cliente-mobile/Camada 1.png"
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
      {/* Background */}
      <div
        className="cm-carousel-bg"
        style={{ backgroundImage: `url("${slide.bg}")` }}
        aria-hidden="true"
      />

      {/* Overlay gradient */}
      <div className="cm-carousel-overlay" aria-hidden="true" />

      {/* Logo */}
      <div className="cm-carousel-logo-wrap">
        <Image
          src="/cliente-mobile/Camada 1.png"
          alt="Planvita"
          width={160}
          height={49}
          priority
        />
      </div>

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
            if (isLast) onComplete();
            else setSlideIndex((n) => n + 1);
          }}
        >
          {isLast ? "Começar" : "Próximo"}
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
