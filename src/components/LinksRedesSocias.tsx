"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Copy,
  Instagram,
  Facebook,
  Send,
  MessageCircle,
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
 * Permite enviar via WhatsApp, Telegram, Facebook, Instagram ou copiar o link.
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
      icon: <MessageCircle className="w-4 h-4 mr-2" />,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      nome: "Telegram",
      url: `https://t.me/share/url?url=${encodedLink}`,
      icon: <Send className="w-4 h-4 mr-2" />,
      color: "bg-sky-500 hover:bg-sky-600",
    },
    {
      nome: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
      icon: <Facebook className="w-4 h-4 mr-2" />,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      nome: "Instagram",
      url: `https://www.instagram.com/?url=${encodedLink}`,
      icon: <Instagram className="w-4 h-4 mr-2" />,
      color: "bg-pink-500 hover:bg-pink-600",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-600" />
            Enviar Link de Cadastro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {redes.map((r) => (
            <Button
              key={r.nome}
              onClick={() => window.open(r.url, "_blank")}
              className={`w-full flex items-center justify-center text-white ${r.color}`}
            >
              {r.icon}
              Enviar via {r.nome}
            </Button>
          ))}

          <Button
            variant="secondary"
            onClick={handleCopy}
            className="w-full flex items-center justify-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Link Copiado!" : "Copiar Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
