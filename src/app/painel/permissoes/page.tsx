"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Shield, PlusCircle } from "lucide-react";

type Role = {
  id?: number;
  name: string;
  permissions: number[];
};

type Permission = {
  id: number;
  name: string;
  description: string;
};

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permRes] = await Promise.all([
          api.get("/roles"),
          api.get("/permissions"),
        ]);
        setRoles(rolesRes.data);
        setPermissions(permRes.data);
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar roles e permissions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    try {
      const res = await api.post("/roles", { name: newRoleName });
      setRoles([...roles, res.data]);
      setNewRoleName("");
    } catch (err) {
      console.error(err);
      alert("Erro ao criar cargo");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (
    roleId: number,
    permissionId: number,
  ) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const currentPermissions = role.permissions ?? [];

    const updatedPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter((p) => p !== permissionId)
      : [...currentPermissions, permissionId];

    try {
      await api.put(`/roles/${roleId}/permissions`, {
        permissionIds: updatedPermissions,
      });
      setRoles(
        roles.map((r) =>
          r.id === roleId ? { ...r, permissions: updatedPermissions } : r,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar permissões");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground animate-pulse">
        Carregando dados...
      </div>
    );

  return (
    <motion.div
      className="p-8 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Permissões
          </h1>
        </div>
      </div>

      <Separator />

      {/* Criar nova Role */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Criar Novo Cargo
          </CardTitle>
          <CardDescription>
            Defina um nome para o novo cargo do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Label>Nome do Cargo</Label>
            <Input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Ex: Administrador, Gestor, Financeiro..."
            />
          </div>
          <Button onClick={handleCreateRole} disabled={saving}>
            {saving ? "Salvando..." : "Criar Cargo"}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Roles */}
      <ScrollArea className="h-[70vh]">
        <div className="space-y-6">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>
                      {role.permissions?.length > 0 ? (
                        <span>
                          {role.permissions?.length} permissões atribuídas
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Nenhuma permissão atribuída
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="text-xs px-2 py-1">
                    ID: {role.id}
                  </Badge>
                </CardHeader>

                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {permissions.map((perm) => {
                    const checked = role.permissions?.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 transition"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() =>
                            handleTogglePermission(role.id!, perm.id)
                          }
                        />
                        <Label className="text-sm">{perm.description}</Label>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
