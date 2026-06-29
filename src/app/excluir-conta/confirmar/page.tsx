import type { Metadata } from "next";
import { ConfirmarExclusaoClient } from "./ConfirmarExclusaoClient";

export const metadata: Metadata = {
  title: "Confirmar Exclusão de Conta — Campo do Bosque",
  description:
    "Confirme a exclusão da sua conta na plataforma Campo do Bosque.",
};

export default function ConfirmarExclusaoPage() {
  return <ConfirmarExclusaoClient />;
}
