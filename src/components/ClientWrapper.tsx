"use client";

import { ReactNode } from "react";
import SidebarWrapper from "@/components/SidebarWrapper";
import { ThemeProvider } from "@/context/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarWrapper>{children}</SidebarWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
