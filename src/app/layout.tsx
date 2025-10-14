import "./globals.css";
import { ReactNode } from "react";
import SidebarWrapper from "@/components/SidebarWrapper";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}
