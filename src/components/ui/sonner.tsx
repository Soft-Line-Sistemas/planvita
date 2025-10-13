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
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};
