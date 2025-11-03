"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps as SonnerProps } from "sonner";

export const Toaster: React.FC<SonnerProps> = ({ ...props }) => {
  const { theme } = useTheme();

  const toasterTheme: "system" | "light" | "dark" =
    theme === "light" || theme === "dark" ? theme : "system";

  return (
    <Sonner
      theme={toasterTheme}
      className="toaster group"
      position="top-right"
      richColors
      style={
        {
          // Cores suaves no tema Planvita
          "--normal-bg": "#f0fdf4", // fundo verde claro
          "--normal-text": "#14532d", // verde escuro texto
          "--normal-border": "#86efac", // verde médio borda

          "--success-bg": "#dcfce7", // sucesso
          "--success-text": "#166534",
          "--success-border": "#86efac",

          "--error-bg": "#fef2f2", // erro suave
          "--error-text": "#991b1b", // vermelho escuro
          "--error-border": "#fca5a5", // vermelho claro

          "--warning-bg": "#fff7ed",
          "--warning-text": "#9a3412",
          "--warning-border": "#fdba74",

          "--info-bg": "#eff6ff",
          "--info-text": "#1e3a8a",
          "--info-border": "#93c5fd",

          borderRadius: "0.75rem",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          border: "1px solid var(--normal-border)",
          backgroundColor: "var(--normal-bg)",
          color: "var(--normal-text)",
          fontSize: "0.9rem",
          fontWeight: 500,
        },
        classNames: {
          description: "text-sm text-gray-600",
          actionButton:
            "bg-green-600 hover:bg-green-700 text-white rounded-md px-3 py-1",
          cancelButton:
            "bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md px-3 py-1",
        },
      }}
      {...props}
    />
  );
};
