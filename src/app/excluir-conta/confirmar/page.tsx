import type { Metadata } from "next";
import { ConfirmarExclusaoClient } from "./ConfirmarExclusaoClient";

export const metadata: Metadata = {
  title: "Confirmar Exclusão de Conta — Campo do Bosque",
  description:
    "Confirme a exclusão da sua conta na plataforma Campo do Bosque.",
};

type ConfirmarExclusaoPageProps = {
  searchParams: Promise<{
    token?: string | string[];
    tenant?: string | string[];
  }>;
};

export default async function ConfirmarExclusaoPage({
  searchParams,
}: ConfirmarExclusaoPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const tenant = Array.isArray(params.tenant)
    ? params.tenant[0]
    : params.tenant;

  return <ConfirmarExclusaoClient token={token ?? ""} tenant={tenant ?? ""} />;
}
