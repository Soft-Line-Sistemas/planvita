"use client";
import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function SidebarWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar =
    !pathname.includes("/login") &&
    pathname !== "/cliente" &&
    pathname !== "/cliente/cadastro";

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
