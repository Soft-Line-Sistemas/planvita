"use client";
import { ReactNode } from "react";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // 🔒 Tema desativado temporariamente
  return <>{children}</>;
};
