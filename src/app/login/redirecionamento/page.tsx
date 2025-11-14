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
import logoPlanvita from "@/assets/logo-planvita.png";

export default function SelectTenantPage() {
  const handleSelectTenant = (tenant: string) => {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

    const host =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_DOMAIN_URL
        : window.location.host;

    const url = `${protocol}://${tenant}.${host}/login`;
    window.location.href = url;
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-700 overflow-hidden">
      {/* background decorativo */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-full max-w-md p-6">
        <Card className="bg-green-700/90 border border-white/20 shadow-2xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image
                src={logoPlanvita}
                alt="Logo Planvita"
                className="w-44 h-auto drop-shadow-lg"
                priority
              />
            </div>
            <CardTitle className="text-3xl font-bold text-white tracking-wide drop-shadow-lg">
              Seleção de Ambiente
            </CardTitle>
            <CardDescription className="text-green-100 font-medium">
              Escolha o ambiente que deseja acessar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 flex flex-col items-center">
            <Button
              onClick={() => handleSelectTenant("lider")}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Lider
            </Button>

            <Button
              onClick={() => handleSelectTenant("pax")}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Pax
            </Button>
            <Button
              onClick={() => handleSelectTenant("bosque")}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Campo do bosque
            </Button>
            <p className="text-center text-sm text-green-100/90 mt-6">
              Área reservada para funcionários autorizados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
