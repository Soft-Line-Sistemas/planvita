"use client";

import { useEffect, useState } from "react";
import { CadastroClienteWizard } from "@/components/CadastroClienteWizard";
import MobileCadastroScreen from "@/features/cliente/mobile/MobileCadastroScreen";

const MOBILE_BREAKPOINT_PX = 1024;

function useIsMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const apply = (matches: boolean) => setIsMobile(matches);
    apply(mq.matches);
    const handler = (ev: MediaQueryListEvent) => apply(ev.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function CadastroPublicoClientePage() {
  const isMobile = useIsMobileBreakpoint();

  if (isMobile === null) return null;

  return isMobile ? (
    <MobileCadastroScreen />
  ) : (
    <CadastroClienteWizard variant="public" />
  );
}
