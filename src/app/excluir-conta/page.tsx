import type { Metadata } from "next";
import { ExcluirContaClient } from "./ExcluirContaClient";

export const metadata: Metadata = {
  title: "Excluir Conta — Campo do Bosque",
  description:
    "Solicite a exclusão da sua conta e dos seus dados pessoais na plataforma Campo do Bosque.",
};

export default function ExcluirContaPage() {
  return <ExcluirContaClient />;
}
