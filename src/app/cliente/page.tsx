"use client";

import { useEffect, useState } from "react";
import ClienteDesktopPage from "@/features/cliente/desktop/ClienteDesktopPage";
import ClienteMobilePage from "@/features/cliente/mobile/ClienteMobilePage";

const MOBILE_BREAKPOINT_PX = 1024;

function useIsMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`,
    );
    const apply = (matches: boolean) => setIsMobile(matches);
    apply(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => apply(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

export default function ClientePage() {
  const isMobile = useIsMobileBreakpoint();
  if (isMobile === null) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          width: "100%",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }
  return isMobile ? <ClienteMobilePage /> : <ClienteDesktopPage />;
}
