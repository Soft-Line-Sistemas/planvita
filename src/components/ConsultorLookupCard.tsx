"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ConsultorPublicResult } from "@/utils/consultorPublic";

function getInitials(name?: string | null) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

type Props = {
  consultor: ConsultorPublicResult;
  locked?: boolean;
};

export function ConsultorLookupCard({ consultor, locked = false }: Props) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar className="size-14 border border-emerald-100">
          <AvatarImage
            src={consultor.avatarUrl ?? undefined}
            alt={consultor.nomeCompleto}
          />
          <AvatarFallback className="bg-emerald-50 text-emerald-700 font-semibold">
            {getInitials(consultor.nomeCompleto)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {consultor.nomeCompleto}
            </p>
            <Badge variant="secondary">{consultor.tenantLabel}</Badge>
            {locked && (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Bloqueado via link
              </Badge>
            )}
          </div>

          <div className="grid gap-1 text-xs text-slate-600">
            <p>
              <span className="font-medium text-slate-700">Codigo:</span>{" "}
              {consultor.codigo}
            </p>
            {consultor.email && (
              <p>
                <span className="font-medium text-slate-700">E-mail:</span>{" "}
                {consultor.email}
              </p>
            )}
            {consultor.whatsapp && (
              <p>
                <span className="font-medium text-slate-700">WhatsApp:</span>{" "}
                {consultor.whatsapp}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
