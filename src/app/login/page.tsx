"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      <section className="relative hidden lg:block lg:w-1/2 min-h-screen overflow-hidden">
        <Image
          src="/adm-pc/login-image.png"
          alt="Mãos em oração"
          fill
          priority
          className="object-cover"
        />
        <Image
          src="/adm-pc/logo.svg"
          alt="Campo do Bosque"
          width={266}
          height={86}
          priority
          className="absolute top-[133px] left-1/2 -translate-x-1/2"
        />
      </section>

      <section
        className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-6 py-10"
        style={{
          background:
            "linear-gradient(232.74deg, rgba(68,145,19,1) 31.11%, rgba(115,226,44,1) 93.74%)",
        }}
      >
        <div className="w-full max-w-[560px] flex flex-col items-center text-center">
          <span className="inline-flex items-center justify-center rounded-[30px] border border-[#7FEF37] px-[30px] py-[10px] text-[10px] font-bold text-[#7FEF37] tracking-[0.04em]">
            ACESSO RESTRITO
          </span>

          <h1 className="mt-7 text-[30px] leading-[1.15] font-bold text-[#054A19]">
            Bem vindo ao Sistema
            <br />
            Campo do Bosque
          </h1>

          <p className="mt-6 text-[16px] font-normal leading-[1.35] text-[#1C5A1F]">
            Digite seus dados de acesso abaixo e
            <br />
            clique em entrar
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-10 w-full">
            <div className="flex flex-col items-center gap-4">
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className={`h-[62px] w-[393px] rounded-[8px] border-[3px] bg-[#EAF1E8] px-8 text-[16px] text-[#5A5A5A] placeholder:text-[#6E6E6E] placeholder:opacity-100 focus-visible:ring-0 ${
                  errors.email
                    ? "border-red-600 focus-visible:border-red-600"
                    : "border-[#7DFF2C] focus-visible:border-[#7DFF2C]"
                }`}
                {...register("email")}
                onFocus={handleFocus}
              />

              <Input
                id="password"
                type="password"
                placeholder="**********"
                className={`h-[62px] w-[393px] rounded-[8px] border-[3px] bg-[#EAF1E8] px-8 text-[16px] text-[#5A5A5A] placeholder:text-[#6E6E6E] placeholder:opacity-100 focus-visible:ring-0 ${
                  errors.password
                    ? "border-red-600 focus-visible:border-red-600"
                    : "border-[#7DFF2C] focus-visible:border-[#7DFF2C]"
                }`}
                {...register("password")}
                onFocus={handleFocus}
              />
            </div>

            {errors.email?.message && (
              <p className="mt-2 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
            {errors.password?.message && (
              <p className="mt-2 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {errorMessage}
              </p>
            )}

            {/*
            <button
              type="button"
              className="mt-6 w-full bg-transparent border-0 p-0 text-center text-[16px] font-medium text-white cursor-pointer"
            >
              Esqueceu sua senha?
            </button>
            */}

            <Button
              type="submit"
              className="mt-7 h-[58px] w-[393px] mx-auto rounded-[55px] border-0 bg-[#115B26] text-[17px] font-bold text-white hover:bg-[#115B26]/90"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entra no sistema"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
