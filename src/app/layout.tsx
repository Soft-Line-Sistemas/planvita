import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import ClientWrapper from "@/components/ClientWrapper";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Planvita",
  description: "Sistema Planvita",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/cliente-mobile/Icone app.png",
    shortcut: "/cliente-mobile/Icone app.png",
    apple: "/cliente-mobile/Icone app.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="color-scheme" content="only light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body>
        <PwaRegister />
        <ClientWrapper>{children}</ClientWrapper>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
