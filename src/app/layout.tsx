"use client";

import "./globals.css";
import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const showSidebar = pathname !== "/login";

  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 flex min-h-screen">
        {showSidebar && <Sidebar />}

        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
