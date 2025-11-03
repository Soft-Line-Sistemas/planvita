"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Share2,
  Copy,
  Instagram,
  Facebook,
  Send,
  MessageCircle,
  Check,
} from "lucide-react";
import { useState } from "react";

interface LinksRedesSociaisProps {
  /** Link que será compartilhado */
  link: string;
  /** Controle de exibição do modal */
  open: boolean;
  /** Função de fechamento do modal */
  onClose: () => void;
}

/**
 * Modal de compartilhamento do link de cadastro
 * Interface mais limpa e moderna: ícones circulares com nomes abaixo.
 */
export default function LinksRedesSociais({
  link,
  open,
  onClose,
}: LinksRedesSociaisProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const encodedLink = encodeURIComponent(link);

  const redes = [
    {
      nome: "WhatsApp",
      url: `https://wa.me/?text=${encodedLink}`,
      icon: <MessageCircle className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      nome: "Telegram",
      url: `https://t.me/share/url?url=${encodedLink}`,
      icon: <Send className="w-6 h-6" />,
      color: "bg-sky-500",
    },
    {
      nome: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      icon: <Facebook className="w-6 h-6" />,
      color: "bg-blue-600",
    },
    {
      nome: "Instagram",
      url: `https://www.instagram.com/?url=${encodedLink}`,
      icon: <Instagram className="w-6 h-6" />,
      color: "bg-pink-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-600" />
            Compartilhar Link de Cadastro
          </DialogTitle>
        </DialogHeader>

        {/* Grade de ícones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center mt-4">
          {redes.map((r) => (
            <div
              key={r.nome}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => window.open(r.url, "_blank")}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-transform transform group-hover:scale-110 ${r.color}`}
              >
                {r.icon}
              </div>
              <span className="text-xs mt-2 text-gray-700 group-hover:text-black transition-colors">
                {r.nome}
              </span>
            </div>
          ))}

          {/* Copiar link */}
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={handleCopy}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-gray-700 bg-gray-200 shadow-md transition-transform transform group-hover:scale-110`}
            >
              {copied ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : (
                <Copy className="w-6 h-6" />
              )}
            </div>
            <span className="text-xs mt-2 text-gray-700 group-hover:text-black transition-colors">
              {copied ? "Copiado!" : "Copiar"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
