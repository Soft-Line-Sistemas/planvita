"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface Props {
  stats: {
    total: number;
    ativos: number;
    pendentes: number;
    inadimplentes: number;
  };
}

export const ClienteStats = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card className="border border-gray-200 bg-white hover:shadow-md transition">
      <CardContent className="flex items-center gap-3 p-4">
        <Users className="w-6 h-6 text-gray-700" />
        <div>
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-lg font-semibold">{stats.total}</p>
        </div>
      </CardContent>
    </Card>

    <Card className="border border-gray-200 bg-white hover:shadow-md transition">
      <CardContent className="flex items-center gap-3 p-4">
        <CheckCircle className="w-6 h-6 text-emerald-600" />
        <div>
          <p className="text-sm text-gray-600">Ativos</p>
          <p className="text-lg font-semibold">{stats.ativos}</p>
        </div>
      </CardContent>
    </Card>

    <Card className="border border-gray-200 bg-white hover:shadow-md transition">
      <CardContent className="flex items-center gap-3 p-4">
        <AlertTriangle className="w-6 h-6 text-amber-600" />
        <div>
          <p className="text-sm text-gray-600">Pendentes</p>
          <p className="text-lg font-semibold">{stats.pendentes}</p>
        </div>
      </CardContent>
    </Card>

    <Card className="border border-gray-200 bg-white hover:shadow-md transition">
      <CardContent className="flex items-center gap-3 p-4">
        <XCircle className="w-6 h-6 text-rose-600" />
        <div>
          <p className="text-sm text-gray-600">Inadimplentes</p>
          <p className="text-lg font-semibold">{stats.inadimplentes}</p>
        </div>
      </CardContent>
    </Card>
  </div>
);
