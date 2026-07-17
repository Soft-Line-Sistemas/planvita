"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import logoCampoDoBosque from "@/assets/logo-planvita.png";

export default function SelectTenantPage() {
  const handleSelectTenant = (tenant: string) => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    // Salva o tenant em um cookie para persistência (útil na Vercel)
    document.cookie = `tenant=${tenant}; path=/; max-age=31536000; SameSite=Lax`;

    // Se estivermos na Vercel (domínio .vercel.app), subdomínios dedicados
    // geralmente não funcionam sem configuração de Wildcard.
    if (hostname.includes("vercel.app")) {
      window.location.href = `/login?tenant=${tenant}`;
      return;
    }

    // Lógica original para domínios próprios ou localhost
    const host =
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_DOMAIN_URL &&
      !process.env.NEXT_PUBLIC_DOMAIN_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_DOMAIN_URL
        : window.location.host;

    // Se o host já contém o tenant (ex: lider.localhost:61347), limpa ele antes de adicionar o novo
    const cleanHost = host.replace(/^(lider|pax|bosque)\./, "");

    const url = `${protocol}//${tenant}.${cleanHost}/login`;
    window.location.href = url;
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(232.74deg, rgba(68,145,19,1) 31.11%, rgba(115,226,44,1) 93.74%)",
      }}
    >
      {/* background decorativo */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-full max-w-md p-6">
        <Card className="rounded-[24px] border border-[#E9E9E9] bg-white shadow-none">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image
                src={logoCampoDoBosque}
                alt="Logo Campo do Bosque"
                className="h-auto w-44"
                priority
              />
            </div>
            <CardTitle className="text-3xl font-bold tracking-wide text-[#121317]">
              Seleção de Ambiente
            </CardTitle>
            <CardDescription className="font-medium text-[#6E6E6E]">
              Escolha o ambiente que deseja acessar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 flex flex-col items-center">
            <Button
              onClick={() => handleSelectTenant("lider")}
              className="w-full rounded-[16px] border border-[#D5D5D5] bg-white py-3 font-semibold text-[#121317] transition-all hover:bg-gray-50"
            >
              Lider
            </Button>

            <Button
              onClick={() => handleSelectTenant("pax")}
              className="w-full rounded-[16px] border border-[#D5D5D5] bg-white py-3 font-semibold text-[#121317] transition-all hover:bg-gray-50"
            >
              Pax
            </Button>
            <Button
              onClick={() => handleSelectTenant("bosque")}
              className="w-full rounded-[16px] border border-[#D5D5D5] bg-white py-3 font-semibold text-[#121317] transition-all hover:bg-gray-50"
            >
              Campo do Bosque
            </Button>
            <p className="mt-6 text-center text-sm text-[#6E6E6E]">
              Área reservada para funcionários autorizados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
