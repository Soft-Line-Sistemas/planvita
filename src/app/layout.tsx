import { ReactNode } from "react";
import type { Metadata } from "next";
import ClientWrapper from "@/components/ClientWrapper";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Planvita",
  description: "Sistema Planvita",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        <ClientWrapper>{children}</ClientWrapper>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
