"use client";

import { useEffect, useState } from "react";

import { CadastroClienteWizard } from "@/components/CadastroClienteWizard";
import MobileCadastroScreen from "@/features/cliente/mobile/MobileCadastroScreen";
import resolvePublicCadastroTenant from "@/utils/resolvePublicCadastroTenant";

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

function usePublicCadastroTenantReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tenant = resolvePublicCadastroTenant(window.location.search);
    document.cookie = `tenant=${tenant}; path=/; max-age=31536000; SameSite=Lax`;
    setReady(true);
  }, []);

  return ready;
}

export default function PublicCadastroPage() {
  const isMobile = useIsMobileBreakpoint();
  const isTenantReady = usePublicCadastroTenantReady();

  if (isMobile === null || !isTenantReady) return null;

  return isMobile ? (
    <MobileCadastroScreen />
  ) : (
    <CadastroClienteWizard variant="public" />
  );
}
