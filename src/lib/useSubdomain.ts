"use client";
import { useMemo } from "react";

export function useSubdomain(): string | null {
  return useMemo(() => {
    if (typeof window === "undefined") return null;

    const host = window.location.hostname;
    const parts = host.split(".");

    if (parts.length === 1 && parts[0] === "localhost") return null;
    if (parts.length === 2 && parts[1] === "localhost") return parts[0];
    if (parts.length > 2 && parts.slice(-3).join(".") === "planvita.com.br") {
      return parts[0];
    }

    return parts.length > 2 ? parts[0] : null;
  }, []);
}
