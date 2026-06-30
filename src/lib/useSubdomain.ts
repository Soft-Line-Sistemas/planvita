"use client";
import { useMemo } from "react";

export function useSubdomain(): string | null {
  return useMemo(() => {
    if (typeof window === "undefined") return null;

    const host = window.location.hostname;
    const parts = host.split(".");
    const subdomainOnlyRoutingEnabled =
      process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING === "true";

    if (parts.length === 1 && parts[0] === "localhost") return null;
    if (parts.length === 2 && parts[1] === "localhost") {
      return parts[0] === "app" ? null : parts[0];
    }

    if (subdomainOnlyRoutingEnabled) {
      const baseDomain =
        parts.length >= 3 && parts.slice(-2).join(".") === "com.br"
          ? parts.slice(-3).join(".")
          : parts.slice(-2).join(".");

      if (host === baseDomain || !host.endsWith(`.${baseDomain}`)) {
        return null;
      }

      const sub = host.slice(0, -(baseDomain.length + 1));
      return sub === "app" ? null : sub;
    }

    if (parts.length > 2 && parts.slice(-3).join(".") === "planvita.com.br") {
      const sub = parts[0];
      return sub === "app" ? null : sub;
    }

    return parts.length > 2 ? parts[0] : null;
  }, []);
}
