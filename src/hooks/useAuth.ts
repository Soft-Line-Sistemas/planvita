import { useState, useEffect, useCallback } from "react";
import api from "@/utils/api";

export interface User {
  id: number;
  nome: string;
  email: string;
  role: { id: number; name: string } | null;
  permissions: string[];
  tenant: string;
  consultor?: {
    id: number;
    nome: string;
    valorComissaoIndicacao: number;
    comissaoPendente: number;
    comissaoPaga: number;
  } | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get<User>("/auth/check");

      setUser(res.data);
      return true;
    } catch {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user || !Array.isArray(user.permissions)) return false;
      return user.permissions.includes(permission);
    },
    [user],
  );

  return { user, loading, checkAuth, hasPermission };
}
