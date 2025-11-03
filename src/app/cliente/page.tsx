"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCPF } from "@/helpers/formHelpers";
import type { ClientePlano } from "@/data/mock-clientes-planos";
import CarteirinhaAsImage from "@/components/CarteirinhaAsImage";

const normalizeCpf = (value: string) => value.replace(/\D/g, "");

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const formatDate = (value: string) =>
  new Date(value + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function ConsultaClientePage() {
  const [cpf, setCpf] = useState("");
  const [cliente, setCliente] = useState<ClientePlano | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const digitsOnly = normalizeCpf(cpf);
    if (digitsOnly.length !== 11) {
      setError("Informe um CPF válido com 11 dígitos.");
      return;
    }

    setIsLoading(true);
    setCliente(null);
    setIsFlipped(false);

    try {
      const response = await fetch(
        `/api/cliente?cpf=${encodeURIComponent(digitsOnly)}`,
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ?? "Não foi possível localizar o plano.",
        );
      }

      const payload = (await response.json()) as { data: ClientePlano };
      setCliente(payload.data);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Erro inesperado ao buscar o plano.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCpf("");
    setCliente(null);
    setError(null);
    setIsFlipped(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pt-16">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[#22c55e]">
            Planvita
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Consulte seu plano pelo CPF
          </h1>
          <p className="text-base text-slate-600 md:text-lg">
            Informe o CPF do titular para visualizar os detalhes completos do
            plano contratado.
          </p>
        </header>

        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4 md:flex-row md:items-end"
          >
            <div className="w-full">
              <label
                htmlFor="cpf"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                CPF do titular
              </label>
              <Input
                id="cpf"
                name="cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(event) => setCpf(formatCPF(event.target.value))}
                maxLength={14}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "cpf-error" : undefined}
              />
              {error && (
                <p id="cpf-error" className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Consultando
                  </>
                ) : (
                  "Consultar"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RefreshCw className="size-4" />
                Limpar
              </Button>
            </div>
          </form>
        </section>

        <section className="flex flex-1 items-center justify-center">
          {isLoading && (
            <div className="flex animate-pulse flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-10 py-12 text-slate-500 shadow-inner">
              <Loader2 className="size-10 animate-spin" />
              <p>Buscando informações do plano...</p>
            </div>
          )}

          {!isLoading && cliente && (
            <CarteirinhaAsImage
              cliente={cliente}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          )}

          {!isLoading && !cliente && !error && (
            <div className="max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500 shadow-inner">
              <p className="text-sm">
                Faça a consulta acima para visualizar os dados do plano do
                titular.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
