"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import logoPlanvita from "@/assets/logo-planvita.png";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { AxiosError } from "axios";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string(),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    try {
      await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      router.push("/painel/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setErrorMessage(
        axiosError.response?.data?.message || "Erro ao efetuar login",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = () => {
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-700 overflow-hidden">
      {/* background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,...")`,
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
              Sistema Planvita
            </CardTitle>
            <CardDescription className="text-green-100 font-medium">
              Gestão de Planos Funerários
              <p
                className={`mt-1 font-bold uppercase ${
                  errorMessage ? "text-red-600 font-bold" : "text-yellow-300"
                }`}
              >
                {errorMessage || "Acesso Restrito"}
              </p>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-semibold">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-white/90 placeholder-gray-500 border-none focus:ring-2 focus:ring-green-400"
                  {...register("email")}
                  onFocus={handleFocus}
                />
                {errors.email && (
                  <p className="text-sm text-red-300">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-semibold">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  className="bg-white/90 placeholder-gray-500 border-none focus:ring-2 focus:ring-green-400"
                  {...register("password")}
                  onFocus={handleFocus}
                />
                {errors.password && (
                  <p className="text-sm text-red-300">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-lg font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    Entrando...
                  </div>
                ) : (
                  "Entrar no Sistema"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-green-100/90 mt-6">
              Área reservada para funcionários autorizados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
