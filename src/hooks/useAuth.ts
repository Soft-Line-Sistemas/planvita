import { useState, useEffect, useCallback } from "react";
import api from "@/utils/api";

export interface User {
  id: number;
  nome: string;
  email: string;
  role: { id: number; name: string } | null;
  permissions: string[];
  tenant: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get<User>("/api/v1/auth/check");

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

  return { user, loading, checkAuth };
}
