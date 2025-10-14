"use client";
import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function SidebarWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/login";

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {showSidebar && <Sidebar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
